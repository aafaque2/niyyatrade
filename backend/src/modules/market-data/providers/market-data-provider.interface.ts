import type {
  MarketQuote,
  FinancialFundamentals,
  ChartCandle,
  SearchResult,
} from '../acl/market-data.schemas';

export interface IMarketDataProvider {
  getQuote(ticker: string): Promise<MarketQuote>;
  getFundamentals(ticker: string): Promise<FinancialFundamentals>;
  getCandles(
    ticker: string,
    resolution: string,
    from?: number,
    to?: number,
  ): Promise<ChartCandle[]>;
  search(query: string): Promise<SearchResult[]>;
}
