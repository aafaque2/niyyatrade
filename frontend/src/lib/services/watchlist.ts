import { api } from "@/lib/api";

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  addedAt: string;
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await api.get<{ data: WatchlistItem[] }>("/watchlist");
  return data.data;
}

export async function addToWatchlist(ticker: string): Promise<WatchlistItem> {
  const { data } = await api.post<{ data: WatchlistItem }>("/watchlist", {
    ticker,
  });
  return data.data;
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  await api.delete(`/watchlist/${ticker}`);
}
