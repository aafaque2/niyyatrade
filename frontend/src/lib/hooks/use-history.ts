"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrderHistory, fetchComplianceHistory } from "@/lib/services/history";

export function useOrderHistory(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["history", "orders", page, limit],
    queryFn: () => fetchOrderHistory(page, limit),
    staleTime: 30_000,
  });
}

export function useComplianceHistory(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["history", "compliance", page, limit],
    queryFn: () => fetchComplianceHistory(page, limit),
    staleTime: 30_000,
  });
}
