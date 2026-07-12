"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluateCompliance } from "@/lib/services/compliance";
import { complianceKeys } from "@/lib/query-keys";

export function useComplianceReport(ticker: string, frameworkId?: string) {
  return useQuery({
    queryKey: complianceKeys.evaluate(ticker, frameworkId),
    queryFn: () => evaluateCompliance(ticker, frameworkId),
    enabled: ticker.length > 0,
    staleTime: 60_000,
    retry: 1,
  });
}
