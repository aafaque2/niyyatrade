"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluateCompliance } from "@/lib/services/compliance";
import { complianceKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useComplianceReport(ticker: string, frameworkId?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: complianceKeys.evaluate(ticker, frameworkId, user?.id),
    queryFn: () => evaluateCompliance(ticker, frameworkId),
    enabled: ticker.length > 0,
    staleTime: 60_000,
    retry: 1,
  });
}
