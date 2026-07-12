import { Injectable, Inject, Logger } from '@nestjs/common';
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

  async getQuote(ticker: string): Promise<MarketQuote> {
    const key = this.cacheKey('quote', ticker.toUpperCase());

    const cached = await this.cacheGet<MarketQuote>(key);
    if (cached) return cached;

    const quote = await this.provider.getQuote(ticker);
    await this.cacheSet(key, CACHE_TTLS.QUOTE, quote);
    return quote;
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    const key = this.cacheKey('fundamentals', ticker.toUpperCase());

    const cached = await this.cacheGet<FinancialFundamentals>(key);
    if (cached) return cached;

    const fundamentals = await this.provider.getFundamentals(ticker);
    await this.cacheSet(key, CACHE_TTLS.FUNDAMENTALS, fundamentals);
    return fundamentals;
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

    const candles = await this.provider.getCandles(
      ticker,
      resolution,
      from,
      to,
    );
    await this.cacheSet(key, CACHE_TTLS.CANDLES, candles);
    return candles;
  }

  async search(query: string): Promise<SearchResult[]> {
    const key = this.cacheKey('search', query.toUpperCase());

    const cached = await this.cacheGet<SearchResult[]>(key);
    if (cached) return cached;

    const results = await this.provider.search(query);
    await this.cacheSet(key, CACHE_TTLS.SEARCH, results);
    return results;
  }
}
