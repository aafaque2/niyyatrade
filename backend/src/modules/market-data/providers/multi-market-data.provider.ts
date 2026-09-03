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
  private chain(
    ticker: string,
  ): Array<{ name: string; p: IMarketDataProvider }> {
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
    // When the query carries a region suffix (e.g. RELIANCE.NS) we know the
    // region: query primary + region provider in parallel, and only hit the
    // third when both come back empty. Plain-text names carry no region
    // signal, so all three are queried to preserve recall.
    const collect = (
      settled: PromiseSettledResult<SearchResult[]>,
      name: string,
    ): SearchResult[] => {
      if (settled.status === 'rejected') {
        this.logger.warn(
          `${name} search failed for "${query}": ${(settled.reason as Error).message}`,
        );
        return [];
      }
      return settled.value;
    };

    let primary: SearchResult[];
    let fmp: SearchResult[];
    let upstox: SearchResult[];

    if (/\.(NS|BO|NSE|BSE|L|LN|DE|F|T|TO|AX|HK|SI)$/i.test(query)) {
      const preferred = this.isIndianTicker(query)
        ? [
            { p: this.primary, name: 'Primary' },
            { p: this.upstox, name: 'Upstox' },
          ]
        : [
            { p: this.primary, name: 'Primary' },
            { p: this.fmp, name: 'FMP' },
          ];
      const [first, second] = await Promise.allSettled(
        preferred.map(({ p }) => p.search(query)),
      );
      primary = collect(first, preferred[0].name);
      const secondResults = collect(second, preferred[1].name);
      let thirdResults: SearchResult[] = [];
      if (primary.length === 0 && secondResults.length === 0) {
        const third = this.isIndianTicker(query) ? this.fmp : this.upstox;
        const name = this.isIndianTicker(query) ? 'FMP' : 'Upstox';
        try {
          thirdResults = await third.search(query);
        } catch (err) {
          this.logger.warn(
            `${name} search failed for "${query}": ${(err as Error).message}`,
          );
        }
      }
      fmp = this.isIndianTicker(query) ? thirdResults : secondResults;
      upstox = this.isIndianTicker(query) ? secondResults : thirdResults;
    } else {
      const [primaryResults, fmpResults, upstoxResults] =
        await Promise.allSettled([
          this.primary.search(query),
          this.fmp.search(query),
          this.upstox.search(query),
        ]);
      primary = collect(primaryResults, 'Primary');
      fmp = collect(fmpResults, 'FMP');
      upstox = collect(upstoxResults, 'Upstox');
    }

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
