"use client";

import { useQuery } from "@tanstack/react-query";
import { getFundamentals } from "@/lib/services/market-data";
import { marketDataKeys } from "@/lib/query-keys";

export function useFundamentals(ticker: string) {
  return useQuery({
    queryKey: marketDataKeys.fundamentals(ticker),
    queryFn: () => getFundamentals(ticker),
    enabled: ticker.length > 0,
    staleTime: 300_000,
    retry: 1,
  });
}
