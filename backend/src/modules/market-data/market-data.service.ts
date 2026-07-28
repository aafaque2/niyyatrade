import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import Redis from 'ioredis';
import type { IMarketDataProvider } from './providers/market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
  MarketDepth,
} from './acl/market-data.schemas';

const CACHE_TTLS = {
  QUOTE: 3,
  FUNDAMENTALS: 86400,
  CANDLES: 5,
  SEARCH: 3600,
  FX: 3600,
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
    const fromTo = from != null || to != null ? `:${from ?? ''}:${to ?? ''}` : '';
    const key = this.cacheKey('candles', ticker.toUpperCase(), resolution + fromTo);

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

  async getDepth(ticker: string): Promise<MarketDepth | null> {
    const key = this.cacheKey('depth', ticker.toUpperCase());

    const cached = await this.cacheGet<MarketDepth>(key);
    if (cached) return cached;

    try {
      const depth = await this.provider.getDepth(ticker);
      if (depth) {
        await this.cacheSet(key, 3, depth);
      }
      return depth;
    } catch (err) {
      this.logger.warn(`getDepth failed for ${ticker}: ${(err as Error).message}`);
      return null;
    }
  }

  async getFxRate(
    from: string,
    to: string,
  ): Promise<{ from: string; to: string; rate: number; timestamp: string }> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return {
        from: fromUpper,
        to: toUpper,
        rate: 1,
        timestamp: new Date().toISOString(),
      };
    }

    const key = this.cacheKey('fx', fromUpper, toUpper);

    const cached = await this.cacheGet<{
      from: string;
      to: string;
      rate: number;
      timestamp: string;
    }>(key);
    if (cached) return cached;

    try {
      const pair = `${fromUpper}${toUpper}=X`;
      const quote = await this.provider.getQuote(pair);
      const rate = quote.priceCents / 100;

      const result = {
        from: fromUpper,
        to: toUpper,
        rate,
        timestamp: new Date().toISOString(),
      };
      await this.cacheSet(key, CACHE_TTLS.FX, result);
      return result;
    } catch (err) {
      this.logger.warn(
        `FX rate fetch failed for ${fromUpper}/${toUpper}: ${(err as Error).message}`,
      );
      throw new HttpException(
        `FX rate not available for ${fromUpper}/${toUpper}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
