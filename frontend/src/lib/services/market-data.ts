import { api } from "@/lib/api";

export interface SearchResult {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  currency: string | null;
}

export interface MarketQuote {
  ticker: string;
  priceCents: number;
  changePercent: number;
  timestamp: string;
  currency?: string;
  marketStatus?: "OPEN" | "CLOSED" | "PRE_MARKET" | "POST_MARKET" | "UNKNOWN";
}

export interface FxRate {
  from: string;
  to: string;
  rate: number;
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

export async function getFxRate(from: string, to: string): Promise<FxRate> {
  const { data } = await api.get<{ data: FxRate }>("/market-data/fx", {
    params: { from, to },
  });
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
  currency?: string;
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
  opts?: { from?: number; to?: number; interval?: string },
): Promise<Candle[]> {
  const params: Record<string, string | number> = {};
  if (resolution) params.resolution = resolution;
  if (opts?.from) params.from = opts.from;
  if (opts?.to) params.to = opts.to;
  if (opts?.interval) params.interval = opts.interval;

  const { data } = await api.get<{ data: Candle[] }>(
    `/market-data/${ticker}/candles`,
    { params },
  );
  return data.data;
}

export interface DepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface MarketDepth {
  ticker: string;
  buy: DepthLevel[];
  sell: DepthLevel[];
  totalBuyQuantity: number;
  totalSellQuantity: number;
  timestamp: string;
}

export async function getDepth(ticker: string): Promise<MarketDepth | null> {
  const { data } = await api.get<{ data: MarketDepth | null }>(
    `/market-data/${ticker}/depth`,
  );
  return data.data;
}
