"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPortfolio } from "@/lib/services/portfolio";
import { portfolioKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

export function usePortfolio(includeCompliance?: boolean) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const enabled = hydrated ? !!token : false;
  return useQuery({
    queryKey: portfolioKeys.detail(),
    queryFn: () => fetchPortfolio(includeCompliance),
    staleTime: 2_500,
    retry: 1,
    refetchInterval: enabled ? 2_500 : false,
    enabled,
  });
}
