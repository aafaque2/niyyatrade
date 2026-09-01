"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuotes, MarketQuote } from "@/lib/services/market-data";

export function useBatchQuotes(tickers: string[]) {
  return useQuery({
    queryKey: ["quotes", ...tickers],
    queryFn: () => getQuotes(tickers),
    staleTime: 30_000,
    refetchInterval: false,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}