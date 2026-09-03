import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
  MarketDepth,
} from '../acl/market-data.schemas';
import {
  MarketQuoteSchema,
  FinancialFundamentalsSchema,
} from '../acl/market-data.schemas';

@Injectable()
export class FmpMarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(FmpMarketDataProvider.name);
  private readonly baseUrl = 'https://financialmodelingprep.com/stable';
  private readonly apiKeys: string[];
  private keyIndex = 0;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
  ) {
    const raw = this.configService.get<string>('FMP_API_KEY', '');
    this.apiKeys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  /**
   * Slot resolution is shared via Redis so every replica round-robins
   * through the key pool (previously each pod stuck to slot 0 and a 402
   * on one pod never helped the others). Falls back to sticky in-memory
   * slot when Redis is unavailable.
   */
  private async resolveSlot(): Promise<number> {
    if (this.apiKeys.length <= 1) return 0;
    if (this.redis) {
      try {
        const n = await this.redis.incr('fmp:key-slot');
        return Number(n) % this.apiKeys.length;
      } catch {
        // fall through to memory
      }
    }
    return this.keyIndex;
  }

  private async rotateSlot(): Promise<number> {
    if (this.apiKeys.length <= 1) return 0;
    if (this.redis) {
      try {
        const n = await this.redis.incr('fmp:key-slot');
        const slot = Number(n) % this.apiKeys.length;
        this.logger.warn(
          `FMP key rotation → slot ${slot} (${this.apiKeys.length} keys available)`,
        );
        return slot;
      } catch {
        // fall through to memory
      }
    }
    const prev = this.keyIndex;
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    this.logger.warn(
      `FMP key rotation: slot ${prev} → ${this.keyIndex} (${this.apiKeys.length} keys available)`,
    );
    return this.keyIndex;
  }

  private static readonly FETCH_TIMEOUT_MS = 10_000;

  private async fetch<T>(path: string, attempt = 0): Promise<T> {
    const slot =
      attempt === 0 ? await this.resolveSlot() : await this.rotateSlot();
    const key = this.apiKeys[slot % this.apiKeys.length];
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}apikey=${key}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NiyyaTrade/1.0' },
      signal: AbortSignal.timeout(FmpMarketDataProvider.FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(
        `FMP ${res.status} for ${path} — ${body.slice(0, 300)}`,
      );

      if (
        (res.status === 402 || res.status === 403) &&
        attempt < this.apiKeys.length - 1
      ) {
        return this.fetch(path, attempt + 1);
      }

      const err = new Error(
        `FMP API error: ${res.status} ${res.statusText}`,
      ) as Error & { statusCode: number };
      err.statusCode = res.status;
      throw err;
    }

    return res.json() as Promise<T>;
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const data = await this.fetch<Record<string, unknown>[]>(
      `/quote?symbol=${ticker}`,
    );

    if (!data || data.length === 0) {
      throw new Error(`No quote data found for ${ticker}`);
    }

    const quote = data[0];

    return MarketQuoteSchema.parse({
      ticker: quote.symbol,
      priceCents: Math.round(Number(quote.price) * 100),
      changePercent: Number(quote.changePercentage),
      timestamp: new Date().toISOString(),
      currency: 'USD',
    });
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const settled = await Promise.allSettled([
      this.fetch<Record<string, unknown>[]>(`/profile?symbol=${ticker}`),
      this.fetch<Record<string, unknown>[]>(`/ratios?symbol=${ticker}`),
      this.fetch<Record<string, unknown>[]>(
        `/balance-sheet-statement?symbol=${ticker}&period=quarter&limit=1`,
      ),
      this.fetch<Record<string, unknown>[]>(
        `/income-statement?symbol=${ticker}&period=quarter&limit=1`,
      ),
    ]);

    const extract = (i: number) =>
      settled[i].status === 'fulfilled' && settled[i].value.length
        ? settled[i].value[0]
        : ({} as Record<string, unknown>);

    const p = extract(0);
    const r = extract(1);
    const b = extract(2);
    const i = extract(3);

    const rangeStr = (p.range as string) ?? '';
    const rangeParts = rangeStr.split(' - ');
    const week52Low =
      rangeParts.length === 2 ? parseFloat(rangeParts[0]) : null;
    const week52High =
      rangeParts.length === 2 ? parseFloat(rangeParts[1]) : null;

    const result = FinancialFundamentalsSchema.safeParse({
      ticker,
      marketCap: p.marketCap ?? null,
      totalAssets: (b.totalAssets as number) ?? null,
      totalDebt: (b.totalDebt as number) ?? null,
      cashAndEquivalents: (b.cashAndCashEquivalents as number) ?? null,
      interestIncome: (i.interestIncome as number) ?? null,
      totalRevenue: (i.revenue as number) ?? null,
      sector: p.sector ?? null,
      industry: p.industry ?? null,
      peRatio: (r.priceToEarningsRatio as number) ?? null,
      dividendYield: (r.dividendYield as number) ?? null,
      volume: (p.averageVolume as number) ?? null,
      week52High,
      week52Low,
      currency: 'USD',
    });

    if (result.success) return result.data;

    this.logger.warn(
      `Fundamentals parse failed for ${ticker}: ${result.error.message}`,
    );
    return FinancialFundamentalsSchema.parse({
      ticker,
      marketCap: 0,
      totalAssets: null,
      totalDebt: null,
      cashAndEquivalents: null,
      interestIncome: null,
      totalRevenue: 0,
      sector: 'Other',
      industry: null,
      peRatio: null,
      dividendYield: null,
      volume: null,
      week52High: null,
      week52Low: null,
      currency: 'USD',
    });
  }

  async getCandles(
    ticker: string,
    _resolution: string,
    from?: number,
    to?: number,
    _interval?: string,
  ): Promise<ChartCandle[]> {
    const fromDate = from
      ? new Date(from * 1000).toISOString().split('T')[0]
      : new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0];
    const toDate = to
      ? new Date(to * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const data = await this.fetch<Record<string, unknown>[]>(
      `/historical-price-eod/full?symbol=${ticker}&from=${fromDate}&to=${toDate}`,
    );

    return (data ?? []).map((item) => {
      const dateStr = item.date as string;
      const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
      return [
        timestamp,
        Math.round(Number(item.open) * 100),
        Math.round(Number(item.high) * 100),
        Math.round(Number(item.low) * 100),
        Math.round(Number(item.close) * 100),
        Number(item.volume ?? 0),
      ] as ChartCandle;
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    const data = await this.fetch<Record<string, unknown>[]>(
      `/search-symbol?query=${query}&limit=10`,
    );

    return (data ?? []).map((item) => {
      const record = item as Record<string, string | null | undefined>;
      return {
        ticker: record.symbol ?? '',
        name: record.name ?? '',
        sector: record.sector ?? null,
        exchange: record.exchange ?? null,
        currency: 'USD',
      };
    });
  }

  getDepth(_ticker: string): Promise<MarketDepth | null> {
    return Promise.resolve(null);
  }
}
