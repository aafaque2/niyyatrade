import { api } from "@/lib/api";

export interface SearchResult {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string | null;
}

export interface MarketQuote {
  ticker: string;
  priceCents: number;
  changePercent: number;
  timestamp: string;
}

export async function searchAssets(query: string): Promise<SearchResult[]> {
  const { data } = await api.get<{ data: SearchResult[] }>("/market-data/search", {
    params: { q: query },
  });
  return data.data;
}

export async function getQuote(ticker: string): Promise<MarketQuote> {
  const { data } = await api.get<{ data: MarketQuote }>(
    `/market-data/${ticker}/quote`
  );
  return data.data;
}

export async function getFundamentals(ticker: string): Promise<Fundamentals> {
  const { data } = await api.get<{ data: Fundamentals }>(
    `/market-data/${ticker}/fundamentals`
  );
  return data.data;
}

export interface Fundamentals {
  ticker: string;
  marketCap: number;
  totalAssets: number;
  totalDebt: number | null;
  cashAndEquivalents: number | null;
  interestIncome: number | null;
  totalRevenue: number;
  sector: string;
  industry: string | null;
  peRatio: number | null;
  dividendYield: number | null;
  volume: number | null;
  week52High: number | null;
  week52Low: number | null;
}

export interface AssetInfo {
  name: string;
  sector: string;
  industry: string | null;
}

export type Candle = [number, number, number, number, number, number];

export async function getCandles(
  ticker: string,
  resolution?: string,
): Promise<Candle[]> {
  const { data } = await api.get<{ data: Candle[] }>(
    `/market-data/${ticker}/candles`,
    { params: resolution ? { resolution } : {} },
  );
  return data.data;
}
