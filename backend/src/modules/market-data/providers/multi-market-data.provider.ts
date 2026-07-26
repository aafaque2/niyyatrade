import { Injectable, Logger } from '@nestjs/common';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from '../acl/market-data.schemas';

@Injectable()
export class MultiMarketDataProvider implements IMarketDataProvider {
  private readonly logger = new Logger(MultiMarketDataProvider.name);

  constructor(
    private readonly primary: IMarketDataProvider,
    private readonly fmp: IMarketDataProvider,
    private readonly upstox: IMarketDataProvider,
  ) {}

  private isIndianTicker(ticker: string): boolean {
    return /\.(NS|BO|NSE|BSE)$/i.test(ticker);
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    try {
      return await this.primary.getQuote(ticker);
    } catch (err) {
      this.logger.warn(
        `Primary quote failed for ${ticker}: ${(err as Error).message}`,
      );
    }

    if (this.isIndianTicker(ticker)) {
      try {
        return await this.upstox.getQuote(ticker);
      } catch (err2) {
        this.logger.warn(
          `Upstox quote also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    } else {
      try {
        return await this.fmp.getQuote(ticker);
      } catch (err2) {
        this.logger.warn(
          `FMP quote also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    }

    throw new Error(`All providers failed for quote ${ticker}`);
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    try {
      return await this.primary.getFundamentals(ticker);
    } catch (err) {
      this.logger.warn(
        `Primary fundamentals failed for ${ticker}: ${(err as Error).message}`,
      );
    }

    if (this.isIndianTicker(ticker)) {
      try {
        return await this.upstox.getFundamentals(ticker);
      } catch (err2) {
        this.logger.warn(
          `Upstox fundamentals also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    } else {
      try {
        return await this.fmp.getFundamentals(ticker);
      } catch (err2) {
        this.logger.warn(
          `FMP fundamentals also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    }

    throw new Error(`All providers failed for fundamentals ${ticker}`);
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    try {
      return await this.primary.getCandles(ticker, resolution, from, to);
    } catch (err) {
      this.logger.warn(
        `Primary candles failed for ${ticker}: ${(err as Error).message}`,
      );
    }

    if (this.isIndianTicker(ticker)) {
      try {
        return await this.upstox.getCandles(ticker, resolution, from, to);
      } catch (err2) {
        this.logger.warn(
          `Upstox candles also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    } else {
      try {
        return await this.fmp.getCandles(ticker, resolution, from, to);
      } catch (err2) {
        this.logger.warn(
          `FMP candles also failed for ${ticker}: ${(err2 as Error).message}`,
        );
      }
    }

    throw new Error(`All providers failed for candles ${ticker}`);
  }

  async search(query: string): Promise<SearchResult[]> {
    const [primaryResults, fmpResults, upstoxResults] =
      await Promise.allSettled([
        this.primary.search(query),
        this.fmp.search(query),
        this.upstox.search(query),
      ]);

    if (primaryResults.status === 'rejected') {
      this.logger.warn(
        `Primary search failed for "${query}": ${(primaryResults.reason as Error).message}`,
      );
    }
    if (fmpResults.status === 'rejected') {
      this.logger.warn(
        `FMP search failed for "${query}": ${(fmpResults.reason as Error).message}`,
      );
    }
    if (upstoxResults.status === 'rejected') {
      this.logger.warn(
        `Upstox search failed for "${query}": ${(upstoxResults.reason as Error).message}`,
      );
    }

    const primary =
      primaryResults.status === 'fulfilled' ? primaryResults.value : [];
    const fmp = fmpResults.status === 'fulfilled' ? fmpResults.value : [];
    const upstox =
      upstoxResults.status === 'fulfilled' ? upstoxResults.value : [];

    const stripSuffix = (t: string) =>
      t.replace(/\.(NS|BO|NSE|BSE)$/i, '').toUpperCase();

    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const item of [...primary, ...upstox, ...fmp]) {
      const key = stripSuffix(item.ticker);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }
}
