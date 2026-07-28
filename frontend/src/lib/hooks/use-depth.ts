"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepth } from "@/lib/services/market-data";
import { marketDataKeys } from "@/lib/query-keys";
import { useMarketStatus } from "@/app/(app)/assets/[ticker]/client";

export function useDepth(ticker: string) {
  const marketStatus = useMarketStatus();
  const isClosed = marketStatus === "CLOSED";

  return useQuery({
    queryKey: marketDataKeys.depth(ticker),
    queryFn: () => getDepth(ticker),
    enabled: ticker.length > 0,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: isClosed ? false : 2_500,
    refetchIntervalInBackground: false,
  });
}
