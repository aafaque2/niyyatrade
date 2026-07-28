"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPortfolio } from "@/lib/services/portfolio";
import { portfolioKeys } from "@/lib/query-keys";

export function usePortfolio(includeCompliance?: boolean) {
  return useQuery({
    queryKey: portfolioKeys.detail(),
    queryFn: () => fetchPortfolio(includeCompliance),
    staleTime: 2_500,
    retry: 1,
    refetchInterval: 2_500,
  });
}
