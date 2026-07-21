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
  ) {}

  private isIndianTicker(ticker: string): boolean {
    return /\.(NS|BO|NSE|BSE)$/i.test(ticker);
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    if (this.isIndianTicker(ticker)) {
      return this.upstox.getQuote(ticker);
    }
    return this.fmp.getQuote(ticker);
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    return this.fmp.getFundamentals(ticker);
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]> {
    if (this.isIndianTicker(ticker)) {
      return this.upstox.getCandles(ticker, resolution, from, to);
    }
    return this.fmp.getCandles(ticker, resolution, from, to);
  }

  async search(query: string): Promise<SearchResult[]> {
    const [fmpResults, upstoxResults] = await Promise.allSettled([
      this.fmp.search(query),
      this.upstox.search(query),
    ]);

    if (fmpResults.status === 'rejected') {
      this.logger.warn(`FMP search failed for "${query}": ${(fmpResults.reason as Error).message}`);
    }
    if (upstoxResults.status === 'rejected') {
      this.logger.warn(`Upstox search failed for "${query}": ${(upstoxResults.reason as Error).message}`);
    }

    const fmp = fmpResults.status === 'fulfilled' ? fmpResults.value : [];
    const upstox = upstoxResults.status === 'fulfilled' ? upstoxResults.value : [];

    const stripSuffix = (t: string) => t.replace(/\.(NS|BO|NSE|BSE)$/i, '').toUpperCase();

    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const item of [...fmp, ...upstox]) {
      const key = stripSuffix(item.ticker);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }
}
