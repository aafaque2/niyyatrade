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
    private readonly fmp: IMarketDataProvider,
    private readonly upstox: IMarketDataProvider,
    private readonly yahoo: IMarketDataProvider,
  ) {}

  private isIndianTicker(ticker: string): boolean {
    return /\.(NS|BO|NSE|BSE)$/i.test(ticker);
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    if (this.isIndianTicker(ticker)) {
      try {
        return await this.yahoo.getQuote(ticker);
      } catch (err) {
        this.logger.warn(
          `Yahoo quote failed for ${ticker}: ${(err as Error).message}, trying Upstox`,
        );
        try {
          return await this.upstox.getQuote(ticker);
        } catch (err2) {
          this.logger.warn(
            `Upstox quote also failed for ${ticker}: ${(err2 as Error).message}`,
          );
          throw err;
        }
      }
    }
    return this.fmp.getQuote(ticker);
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    if (this.isIndianTicker(ticker)) {
      try {
        return await this.upstox.getFundamentals(ticker);
      } catch (err) {
        this.logger.warn(
          `Upstox fundamentals failed for ${ticker}: ${(err as Error).message}`,
        );
        return this.yahoo.getFundamentals(ticker);
      }
    }
    return this.fmp.getFundamentals(ticker);
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    if (this.isIndianTicker(ticker)) {
      try {
        return await this.yahoo.getCandles(ticker, resolution, from, to);
      } catch (err) {
        this.logger.warn(
          `Yahoo candles failed for ${ticker}: ${(err as Error).message}, trying Upstox`,
        );
        try {
          return await this.upstox.getCandles(ticker, resolution, from, to);
        } catch (err2) {
          this.logger.warn(
            `Upstox candles also failed for ${ticker}: ${(err2 as Error).message}`,
          );
          throw err;
        }
      }
    }
    return this.fmp.getCandles(ticker, resolution, from, to);
  }

  async search(query: string): Promise<SearchResult[]> {
    const [fmpResults, upstoxResults, yahooResults] = await Promise.allSettled([
      this.fmp.search(query),
      this.upstox.search(query),
      this.yahoo.search(query),
    ]);

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
    if (yahooResults.status === 'rejected') {
      this.logger.warn(
        `Yahoo search failed for "${query}": ${(yahooResults.reason as Error).message}`,
      );
    }

    const fmp = fmpResults.status === 'fulfilled' ? fmpResults.value : [];
    const upstox =
      upstoxResults.status === 'fulfilled' ? upstoxResults.value : [];
    const yahoo =
      yahooResults.status === 'fulfilled' ? yahooResults.value : [];

    const stripSuffix = (t: string) =>
      t.replace(/\.(NS|BO|NSE|BSE)$/i, '').toUpperCase();

    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const item of [...upstox, ...yahoo, ...fmp]) {
      const key = stripSuffix(item.ticker);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }
}
