"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFxLatest, FxSnapshot } from "@/lib/services/fx";
import { FIXED_FX_USD_BASE } from "@/lib/config/currencies";

export function useFxRates() {
  return useQuery({
    queryKey: ["fx", "latest"],
    queryFn: fetchFxLatest,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}

export function getFxRateFromSnapshot(snap: FxSnapshot | undefined, from: string, to: string): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;
  const rates = snap?.rates ?? FIXED_FX_USD_BASE;
  const fromRate = rates[f];
  const toRate = rates[t];
  if (typeof fromRate === "number" && typeof toRate === "number" && fromRate > 0) {
    return toRate / fromRate;
  }
  const fixedFrom = FIXED_FX_USD_BASE[f];
  const fixedTo = FIXED_FX_USD_BASE[t];
  if (typeof fixedFrom === "number" && typeof fixedTo === "number") return fixedTo / fixedFrom;
  return 1;
}

export function convertCentsWithSnapshot(
  cents: number,
  from: string,
  to: string,
  snap: FxSnapshot | undefined,
): number {
  return Math.round(cents * getFxRateFromSnapshot(snap, from, to));
}
