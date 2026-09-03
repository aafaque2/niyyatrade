import { Injectable, Logger } from '@nestjs/common';
import type { IMarketDataProvider } from './market-data-provider.interface';
import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
  MarketDepth,
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

  /**
   * Full 3-provider chain: primary, then the region-preferred fallback,
   * then the remaining one. Previously only ONE fallback was attempted
   * (Indian never tried FMP, US never tried Upstox).
   */
  private chain(ticker: string): Array<{ name: string; p: IMarketDataProvider }> {
    const indian = this.isIndianTicker(ticker);
    return [
      { name: 'primary', p: this.primary },
      ...(indian
        ? [
            { name: 'upstox', p: this.upstox },
            { name: 'fmp', p: this.fmp },
          ]
        : [
            { name: 'fmp', p: this.fmp },
            { name: 'upstox', p: this.upstox },
          ]),
    ];
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    let lastErr: unknown = null;
    for (const { name, p } of this.chain(ticker)) {
      try {
        return await p.getQuote(ticker);
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `${name} quote failed for ${ticker}: ${(err as Error).message}`,
        );
      }
    }

    throw new Error(
      `All providers failed for quote ${ticker}: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  async getFundamentals(ticker: string): Promise<FinancialFundamentals> {
    let lastErr: unknown = null;
    for (const { name, p } of this.chain(ticker)) {
      try {
        return await p.getFundamentals(ticker);
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `${name} fundamentals failed for ${ticker}: ${(err as Error).message}`,
        );
      }
    }

    throw new Error(
      `All providers failed for fundamentals ${ticker}: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  async getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
    interval?: string,
  ): Promise<ChartCandle[]> {
    let lastErr: unknown = null;
    for (const { name, p } of this.chain(ticker)) {
      try {
        return await p.getCandles(ticker, resolution, from, to, interval);
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `${name} candles failed for ${ticker}: ${(err as Error).message}`,
        );
      }
    }

    throw new Error(
      `All providers failed for candles ${ticker}: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
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

  async getDepth(ticker: string): Promise<MarketDepth | null> {
    for (const { name, p } of this.chain(ticker)) {
      try {
        const depth = await p.getDepth(ticker);
        if (depth && (depth.buy.length > 0 || depth.sell.length > 0)) {
          return depth;
        }
      } catch (err) {
        this.logger.warn(
          `${name} depth failed for ${ticker}: ${(err as Error).message}`,
        );
      }
    }

    return null;
  }
}
