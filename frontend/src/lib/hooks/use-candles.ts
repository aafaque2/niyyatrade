"use client";

import { useQuery } from "@tanstack/react-query";
import { getCandles } from "@/lib/services/market-data";
import { marketDataKeys } from "@/lib/query-keys";

export function useCandles(
  ticker: string,
  resolution?: string,
  opts?: { marketStatus?: string; interval?: string },
) {
  const isClosed = opts?.marketStatus === "CLOSED";
  const interval = opts?.interval;

  return useQuery({
    queryKey: marketDataKeys.candles(ticker, resolution, interval),
    queryFn: () => getCandles(ticker, resolution, { interval }),
    enabled: ticker.length > 0,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: isClosed ? false : 2_500,
    refetchIntervalInBackground: false,
  });
}
