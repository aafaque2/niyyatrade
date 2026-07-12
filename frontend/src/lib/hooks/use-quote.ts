"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuote } from "@/lib/services/market-data";
import { quoteKeys } from "@/lib/query-keys";

export function useQuote(ticker: string) {
  return useQuery({
    queryKey: quoteKeys.detail(ticker),
    queryFn: () => getQuote(ticker),
    enabled: ticker.length > 0,
    staleTime: 30_000,
    retry: 1,
  });
}
