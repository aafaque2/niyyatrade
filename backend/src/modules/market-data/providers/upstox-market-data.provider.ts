import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from '../acl/market-data.schemas';
import {
  MarketQuoteSchema,
  FinancialFundamentalsSchema,
} from '../acl/market-data.schemas';

interface UpstoxInstrument {
  instrument_key: string;
  trading_symbol: string;
  name: string;
  isin: string;
  exchange: string;
  segment: string;
}

@Injectable()
export class UpstoxMarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(UpstoxMarketDataProvider.name);
  private readonly baseUrl = 'https://api.upstox.com/v2';
  private accessToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: Redis,
  ) {
    this.accessToken = this.configService.get<string>('UPSTOX_ACCESS_TOKEN', '');
  }

  private get authHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
    };
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, { headers: this.authHeaders });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Upstox ${res.status} for ${path} — ${body.slice(0, 300)}`);
      const err = new Error(
        `Upstox API error: ${res.status} ${res.statusText}`,
      ) as Error & { statusCode: number };
      err.statusCode = res.status;
      throw err;
    }

    const json = (await res.json()) as { status: string; data: T; errors?: unknown[] };
    if (json.status !== 'success') {
      const err = new Error(
        `Upstox API error: ${JSON.stringify(json.errors ?? json)}`,
      ) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    return json.data;
  }

  stripExchangeSuffix(ticker: string): string {
    return ticker.replace(/\.(NS|BO|NSE|BSE)$/i, '');
  }

  isNSE(ticker: string): boolean {
    return /\.(NS|NSE)$/i.test(ticker);
  }

  isBSE(ticker: string): boolean {
    return /\.(BO|BSE)$/i.test(ticker);
  }

  private cacheKey(type: string, ...parts: string[]): string {
    return `upstox:${type}:${parts.join(':')}`;
  }

  async resolveInstrumentKey(ticker: string): Promise<UpstoxInstrument> {
    const symbol = this.stripExchangeSuffix(ticker.toUpperCase());
    const cacheKey = this.cacheKey('instrument', symbol);

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as UpstoxInstrument;

    const exchange = this.isBSE(ticker) ? 'BSE' : 'NSE';
    const data = await this.fetch<UpstoxInstrument[]>(
      `/instruments/search?query=${symbol}&exchanges=${exchange}&segments=EQ`,
    );

    if (!data || data.length === 0) {
      throw new Error(`No Upstox instrument found for ${ticker}`);
    }

    const exact = data.find(
      (i) => i.trading_symbol.toUpperCase() === symbol,
    );
    const instrument = exact ?? data[0];

    await this.redis.setex(cacheKey, 86400 * 30, JSON.stringify(instrument));
    return instrument;
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const instrument = await this.resolveInstrumentKey(ticker);
    const data = await this.fetch<Record<string, Record<string, unknown>>>(
      `/market-quote/quotes?instrument_key=${instrument.instrument_key}`,
    );

    const quoteKey = `${instrument.segment}:${instrument.trading_symbol}`;
    const quoteData = data[quoteKey] ?? data[instrument.instrument_key];

    if (!quoteData) {
      throw new Error(`No quote data for ${ticker}`);
    }

    const lastPrice = Number(quoteData.last_price ?? 0);
    const netChange = Number(quoteData.net_change ?? 0);
    const prevClose = lastPrice - netChange;
    const changePercent = prevClose > 0
      ? (netChange / prevClose) * 100
      : 0;

    return MarketQuoteSchema.parse({
      ticker: ticker.toUpperCase(),
      priceCents: Math.round(lastPrice * 100),
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const instrument = await this.resolveInstrumentKey(ticker);
    const isin = instrument.isin;

    const settled = await Promise.allSettled([
      this.fetch<Record<string, unknown>>(`/fundamentals/key-ratios/${isin}`),
      this.fetch<Record<string, unknown>>(`/fundamentals/balance-sheet/${isin}`),
      this.fetch<Record<string, unknown>>(`/fundamentals/income-statement/${isin}`),
      this.fetch<Record<string, unknown>>(`/fundamentals/company-profile/${isin}`),
    ]);

    const extract = (i: number): Record<string, unknown> =>
      settled[i].status === 'fulfilled'
        ? (settled[i].value as Record<string, unknown>)
        : {};

    const ratios = extract(0);
    const balance = extract(1);
    const income = extract(2);
    const profile = extract(3);

    const keyRatios = (ratios.keyRatios ?? ratios) as Record<string, unknown>;
    const balanceData = (balance.balanceSheet ?? balance) as Record<string, Record<string, unknown>>;
    const latestBalance = balanceData.latest ?? balanceData.annual?.[0] ?? balanceData.quarterly?.[0] ?? {};
    const incomeData = (income.incomeStatement ?? income) as Record<string, Record<string, unknown>>;
    const latestIncome = incomeData.latest ?? incomeData.annual?.[0] ?? incomeData.quarterly?.[0] ?? {};

    const result = FinancialFundamentalsSchema.safeParse({
      ticker: ticker.toUpperCase(),
      marketCap: (profile.marketCap as number) ?? (keyRatios.marketCap as number) ?? null,
      totalAssets: (latestBalance.totalAssets as number) ?? null,
      totalDebt: (latestBalance.totalBorrowings as number) ?? (latestBalance.totalDebt as number) ?? null,
      cashAndEquivalents: (latestBalance.cashAndCashEquivalents as number) ?? null,
      interestIncome: (latestIncome.interestIncome as number) ?? null,
      totalRevenue: (latestIncome.revenue as number) ?? (latestIncome.totalRevenue as number) ?? null,
      sector: (profile.sector as string) ?? null,
      industry: (profile.industry as string) ?? null,
      peRatio: (keyRatios.priceToEarnings as number) ?? (keyRatios.peRatio as number) ?? null,
      dividendYield: (keyRatios.dividendYield as number) ?? null,
      volume: (keyRatios.averageVolume as number) ?? null,
      week52High: (keyRatios['52WeekHigh'] as number) ?? (keyRatios.week52High as number) ?? null,
      week52Low: (keyRatios['52WeekLow'] as number) ?? (keyRatios.week52Low as number) ?? null,
    });

    if (result.success) return result.data;

    this.logger.warn(`Upstox fundamentals parse failed for ${ticker}: ${result.error.message}`);
    return FinancialFundamentalsSchema.parse({
      ticker: ticker.toUpperCase(),
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
    });
  }

  async getCandles(
    ticker: string,
    _resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    const instrument = await this.resolveInstrumentKey(ticker);
    const toDate = to
      ? new Date(to * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const fromDate = from
      ? new Date(from * 1000).toISOString().split('T')[0]
      : new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];

    const data = await this.fetch<{ candles: (string | number)[][] }>(
      `/historical-candle/${instrument.instrument_key}/day/${toDate}/${fromDate}`,
    );

    return (data.candles ?? []).map((candle) => {
      const timestamp = Math.floor(new Date(candle[0] as string).getTime() / 1000);
      return [
        timestamp,
        Math.round(Number(candle[1]) * 100),
        Math.round(Number(candle[2]) * 100),
        Math.round(Number(candle[3]) * 100),
        Math.round(Number(candle[4]) * 100),
        Number(candle[5] ?? 0),
      ] as ChartCandle;
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    const data = await this.fetch<UpstoxInstrument[]>(
      `/instruments/search?query=${encodeURIComponent(query)}&exchanges=NSE,BSE&segments=EQ`,
    );

    return (data ?? []).map((item) => ({
      ticker: `${item.trading_symbol}.NS`,
      name: item.name ?? item.trading_symbol,
      sector: null,
      exchange: item.exchange ?? null,
    }));
  }
}
