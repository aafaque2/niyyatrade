"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFrameworks,
  fetchFrameworkPrefs,
} from "@/lib/services/identity";
import { frameworkKeys } from "@/lib/query-keys";

export function useFrameworks() {
  return useQuery({
    queryKey: frameworkKeys.list(),
    queryFn: fetchFrameworks,
    staleTime: 300_000,
  });
}

export function useFrameworkPrefs() {
  return useQuery({
    queryKey: ["framework-prefs"],
    queryFn: fetchFrameworkPrefs,
    staleTime: 60_000,
  });
}
