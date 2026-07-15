import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';
import type { IMarketDataProvider } from './providers/market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from './acl/market-data.schemas';

const CACHE_TTLS = {
  QUOTE: 60,
  FUNDAMENTALS: 86400,
  CANDLES: 3600,
  SEARCH: 3600,
} as const;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    @Inject('MARKET_DATA_PROVIDER')
    private readonly provider: IMarketDataProvider,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  private cacheKey(type: string, ...parts: string[]): string {
    return `md:${type}:${parts.join(':')}`;
  }

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (err) {
      this.logger.warn(
        `Redis get failed for key ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async cacheSet(
    key: string,
    ttl: number,
    data: unknown,
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
      this.logger.warn(
        `Redis set failed for key ${key}: ${(err as Error).message}`,
      );
    }
  }

  private mapProviderError(err: unknown, context: string): never {
    const e = err as Error & { statusCode?: number };
    const status = e.statusCode ?? 502;
    this.logger.warn(`${context}: ${e.message}`);
    if (status === 402 || status === 403) {
      throw new HttpException(
        `Data not available for this symbol on the current plan`,
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      `Market data provider error: ${e.message}`,
      status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY,
    );
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    const key = this.cacheKey('quote', ticker.toUpperCase());

    const cached = await this.cacheGet<MarketQuote>(key);
    if (cached) return cached;

    try {
      const quote = await this.provider.getQuote(ticker);
      await this.cacheSet(key, CACHE_TTLS.QUOTE, quote);
      return quote;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.mapProviderError(err, `getQuote(${ticker})`);
    }
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const key = this.cacheKey('fundamentals', ticker.toUpperCase());

    const cached = await this.cacheGet<FinancialFundamentals>(key);
    if (cached) return cached;

    try {
      const fundamentals = await this.provider.getFundamentals(ticker);
      await this.cacheSet(key, CACHE_TTLS.FUNDAMENTALS, fundamentals);
      return fundamentals;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.mapProviderError(err, `getFundamentals(${ticker})`);
    }
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    const key = this.cacheKey('candles', ticker.toUpperCase(), resolution);

    const cached = await this.cacheGet<ChartCandle[]>(key);
    if (cached) return cached;

    try {
      const candles = await this.provider.getCandles(
        ticker,
        resolution,
        from,
        to,
      );
      await this.cacheSet(key, CACHE_TTLS.CANDLES, candles);
      return candles;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.mapProviderError(err, `getCandles(${ticker})`);
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    const key = this.cacheKey('search', query.toUpperCase());

    const cached = await this.cacheGet<SearchResult[]>(key);
    if (cached) return cached;

    try {
      const results = await this.provider.search(query);
      await this.cacheSet(key, CACHE_TTLS.SEARCH, results);
      return results;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.mapProviderError(err, `search(${query})`);
    }
  }
}
