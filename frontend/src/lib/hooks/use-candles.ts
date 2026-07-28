"use client";

import { useQuery } from "@tanstack/react-query";
import { getCandles } from "@/lib/services/market-data";
import { marketDataKeys } from "@/lib/query-keys";

export function useCandles(
  ticker: string,
  resolution?: string,
  opts?: { marketStatus?: string },
) {
  const isClosed = opts?.marketStatus === "CLOSED";

  return useQuery({
    queryKey: marketDataKeys.candles(ticker, resolution),
    queryFn: () => getCandles(ticker, resolution),
    enabled: ticker.length > 0,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: isClosed ? false : 2_500,
    refetchIntervalInBackground: false,
  });
}
