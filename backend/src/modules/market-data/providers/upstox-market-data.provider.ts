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
import { MarketQuoteSchema } from '../acl/market-data.schemas';

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
    this.accessToken = this.configService.get<string>(
      'UPSTOX_ACCESS_TOKEN',
      '',
    );
  }

  private get authHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json',
    };
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, { headers: this.authHeaders });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(
        `Upstox ${res.status} for ${path} — ${body.slice(0, 300)}`,
      );
      const err = new Error(
        `Upstox API error: ${res.status} ${res.statusText}`,
      ) as Error & { statusCode: number };
      err.statusCode = res.status;
      throw err;
    }

    const json = (await res.json()) as {
      status: string;
      data: T;
      errors?: unknown[];
    };
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

    const exact = data.find((i) => i.trading_symbol.toUpperCase() === symbol);
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
    const changePercent = prevClose > 0 ? (netChange / prevClose) * 100 : 0;

    return MarketQuoteSchema.parse({
      ticker: ticker.toUpperCase(),
      priceCents: Math.round(lastPrice * 100),
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date().toISOString(),
      currency: 'INR',
    });
  }

  async getFundamentals(_ticker: string): Promise<FinancialFundamentals> {
    throw new Error(
      'Upstox free tier does not support fundamentals — use FMP provider',
    );
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
      const timestamp = Math.floor(new Date(candle[0]).getTime() / 1000);
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

    return (data ?? []).map((item) => {
      const suffix = item.exchange === 'BSE' ? '.BO' : '.NS';
      return {
        ticker: `${item.trading_symbol}${suffix}`,
        name: item.name ?? item.trading_symbol,
        sector: null,
        exchange: item.exchange ?? null,
        currency: 'INR',
      };
    });
  }
}
