"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuote } from "@/lib/services/market-data";
import { quoteKeys } from "@/lib/query-keys";

export function useQuote(
  ticker: string,
  opts?: { marketStatus?: string },
) {
  const isClosed = opts?.marketStatus === "CLOSED";

  return useQuery({
    queryKey: quoteKeys.detail(ticker),
    queryFn: () => getQuote(ticker),
    enabled: ticker.length > 0,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: isClosed ? false : 2_500,
    refetchIntervalInBackground: false,
  });
}
