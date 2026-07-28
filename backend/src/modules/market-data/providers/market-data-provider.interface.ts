import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
  MarketDepth,
} from '../acl/market-data.schemas';

export interface IMarketDataProvider {
  getQuote(ticker: string): Promise<MarketQuote>;
  getFundamentals(ticker: string): Promise<FinancialFundamentals>;
  getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
    interval?: string,
  ): Promise<ChartCandle[]>;
  search(query: string): Promise<SearchResult[]>;
  getDepth(ticker: string): Promise<MarketDepth | null>;
}
