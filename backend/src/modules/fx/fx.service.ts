import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

const FIXED_RATES_USD_BASE: Record<string, number> = {
  USD: 1,
  INR: 100, // user requested constant fallback: $1 = ₹100
  GBP: 0.8,
  EUR: 0.92,
  AED: 3.67,
  SAR: 3.75,
};

const SUPPORTED_CURRENCIES = Object.keys(FIXED_RATES_USD_BASE);
const REDIS_KEY_LATEST = 'fx:latest';
const REDIS_KEY_DAILY_PREFIX = 'fx:daily:';
const FETCH_TIMEOUT_MS = 10000;
const FETCH_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export interface FxSnapshot {
  date: string; // YYYY-MM-DD IST
  base: string;
  rates: Record<string, number>;
  source: string;
  fetchedAt: string;
}

@Injectable()
export class FxService implements OnModuleInit {
  private readonly logger = new Logger(FxService.name);
  private memoryRates: Record<string, number> | null = null;
  private memoryDate: string | null = null;
  private memorySource = 'fixed';

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    // Deferred: ensureDailyRates() can hit network (10s timeout) + Redis + DB.
    // Must not block HTTP listen on cold boot — warm in background.
    setImmediate(() => {
      void this.ensureDailyRates().catch((err) => {
        this.logger.warn(
          `FxService init failed: ${(err as Error).message} — using fixed rates`,
        );
      });
    });
  }

  // Daily at 00:00 IST (18:30 UTC)
  @Cron('30 18 * * *')
  async handleDailyCron() {
    this.logger.log('Running daily FX refresh cron');
    try {
      await this.refreshDailyRates();
    } catch (err) {
      this.logger.error(`Daily FX cron failed: ${(err as Error).message}`);
    }
  }

  private getTodayIstDate(): string {
    // YYYY-MM-DD in Asia/Kolkata
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }

  private async fetchFromApi(): Promise<{
    rates: Record<string, number>;
    source: string;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(FETCH_URL, { signal: controller.signal });
      if (!res.ok) throw new Error(`FX API HTTP ${res.status}`);
      const data = (await res.json()) as {
        base: string;
        rates: Record<string, number>;
      };
      if (!data.rates || typeof data.rates !== 'object')
        throw new Error('Invalid FX API response');
      // Filter to supported currencies, ensure USD present
      const filtered: Record<string, number> = { USD: 1 };
      for (const cur of SUPPORTED_CURRENCIES) {
        if (cur === 'USD') continue;
        const v = data.rates[cur];
        if (typeof v === 'number' && v > 0) filtered[cur] = v;
        else filtered[cur] = FIXED_RATES_USD_BASE[cur];
      }
      // Ensure all supported present
      for (const cur of SUPPORTED_CURRENCIES) {
        if (!(cur in filtered)) filtered[cur] = FIXED_RATES_USD_BASE[cur];
      }
      return { rates: filtered, source: 'exchangerate-api' };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async saveSnapshot(
    date: string,
    rates: Record<string, number>,
    source: string,
  ) {
    const snapshot: FxSnapshot = {
      date,
      base: 'USD',
      rates,
      source,
      fetchedAt: new Date().toISOString(),
    };
    // Redis: latest + daily
    try {
      await this.redis.set(
        REDIS_KEY_LATEST,
        JSON.stringify(snapshot),
        'EX',
        36 * 3600,
      );
      await this.redis.set(
        `${REDIS_KEY_DAILY_PREFIX}${date}`,
        JSON.stringify(snapshot),
        'EX',
        48 * 3600,
      );
    } catch (err) {
      this.logger.warn(`Redis FX cache set failed: ${(err as Error).message}`);
    }
    // DB: upsert
    try {
      await this.prisma.fxDailyRate.upsert({
        where: { date: new Date(date) },
        update: {
          rates: rates,
          source,
          fetchedAt: new Date(),
        },
        create: {
          date: new Date(date),
          base: 'USD',
          rates: rates,
          source,
        },
      });
    } catch (err) {
      this.logger.warn(`DB FX upsert failed: ${(err as Error).message}`);
    }
    this.memoryRates = rates;
    this.memoryDate = date;
    this.memorySource = source;
  }

  async refreshDailyRates(): Promise<FxSnapshot> {
    const today = this.getTodayIstDate();
    try {
      const { rates, source } = await this.fetchFromApi();
      await this.saveSnapshot(today, rates, source);
      this.logger.log(
        `FX rates refreshed for ${today} from ${source}: ${JSON.stringify(rates)}`,
      );
      return {
        date: today,
        base: 'USD',
        rates,
        source,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(
        `FX API failed for ${today}: ${(err as Error).message} — trying cache/DB/fixed`,
      );
      // Try to load existing snapshot for today from DB/Redis, else fallback to fixed
      const existing = await this.loadSnapshot(today);
      if (existing) {
        this.memoryRates = existing.rates;
        this.memoryDate = existing.date;
        this.memorySource = existing.source;
        return existing;
      }
      // Fallback to fixed
      await this.saveSnapshot(today, FIXED_RATES_USD_BASE, 'fixed-fallback');
      return {
        date: today,
        base: 'USD',
        rates: FIXED_RATES_USD_BASE,
        source: 'fixed-fallback',
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  private async loadSnapshot(date: string): Promise<FxSnapshot | null> {
    // Try Redis daily
    try {
      const raw = await this.redis.get(`${REDIS_KEY_DAILY_PREFIX}${date}`);
      if (raw) return JSON.parse(raw) as FxSnapshot;
    } catch {
      // ignore
    }
    // Try Redis latest
    try {
      const raw = await this.redis.get(REDIS_KEY_LATEST);
      if (raw) {
        const snap = JSON.parse(raw) as FxSnapshot;
        // Use latest if it's today or recent
        if (snap.date === date) return snap;
        // If latest is recent (within 2 days), use it as stale
        const latestTime = new Date(snap.fetchedAt).getTime();
        if (Date.now() - latestTime < 48 * 3600 * 1000) return snap;
      }
    } catch {
      // ignore
    }
    // Try DB for today
    try {
      const row = await this.prisma.fxDailyRate.findUnique({
        where: { date: new Date(date) },
      });
      if (row) {
        return {
          date,
          base: row.base,
          rates: row.rates as unknown as Record<string, number>,
          source: row.source,
          fetchedAt: row.fetchedAt.toISOString(),
        };
      }
      // Try latest DB row
      const latest = await this.prisma.fxDailyRate.findFirst({
        orderBy: { date: 'desc' },
      });
      if (latest) {
        return {
          date: latest.date.toISOString().split('T')[0],
          base: latest.base,
          rates: latest.rates as unknown as Record<string, number>,
          source: latest.source,
          fetchedAt: latest.fetchedAt.toISOString(),
        };
      }
    } catch (err) {
      this.logger.warn(`DB FX load failed: ${(err as Error).message}`);
    }
    return null;
  }

  async ensureDailyRates(): Promise<FxSnapshot> {
    const today = this.getTodayIstDate();
    // Memory fast path
    if (this.memoryRates && this.memoryDate === today) {
      return {
        date: today,
        base: 'USD',
        rates: this.memoryRates,
        source: this.memorySource,
        fetchedAt: new Date().toISOString(),
      };
    }
    const cached = await this.loadSnapshot(today);
    if (cached) {
      this.memoryRates = cached.rates;
      this.memoryDate = cached.date;
      this.memorySource = cached.source;
      return cached;
    }
    // No cache — fetch fresh
    return this.refreshDailyRates();
  }

  async getSnapshot(): Promise<FxSnapshot> {
    return this.ensureDailyRates();
  }

  async getRate(from: string, to: string): Promise<number> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return 1;
    const snap = await this.ensureDailyRates();
    const rates = snap.rates;
    // rates are USD base: rates[USD]=1, rates[INR]=100 etc.
    const fromRate = rates[f];
    const toRate = rates[t];
    if (
      typeof fromRate === 'number' &&
      typeof toRate === 'number' &&
      fromRate > 0
    ) {
      return toRate / fromRate;
    }
    // Fallback to fixed
    const fixedFrom = FIXED_RATES_USD_BASE[f];
    const fixedTo = FIXED_RATES_USD_BASE[t];
    if (typeof fixedFrom === 'number' && typeof fixedTo === 'number') {
      this.logger.warn(
        `FX rate missing for ${f}/${t} in snapshot, using fixed fallback`,
      );
      return fixedTo / fixedFrom;
    }
    throw new Error(`FX rate not available for ${f}/${t}`);
  }

  async convertCents(cents: number, from: string, to: string): Promise<number> {
    const rate = await this.getRate(from, to);
    return Math.round(cents * rate);
  }

  // Sync version for when rates already loaded (avoid async in hot path if memory present)
  getRateSync(from: string, to: string): number {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return 1;
    const rates = this.memoryRates ?? FIXED_RATES_USD_BASE;
    const fromRate = rates[f];
    const toRate = rates[t];
    if (
      typeof fromRate === 'number' &&
      typeof toRate === 'number' &&
      fromRate > 0
    ) {
      return toRate / fromRate;
    }
    const fixedFrom = FIXED_RATES_USD_BASE[f];
    const fixedTo = FIXED_RATES_USD_BASE[t];
    if (typeof fixedFrom === 'number' && typeof fixedTo === 'number')
      return fixedTo / fixedFrom;
    return 1;
  }
}
