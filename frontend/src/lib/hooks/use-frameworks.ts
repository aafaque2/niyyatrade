"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchFrameworks,
  fetchFrameworkPrefs,
} from "@/lib/services/identity";
import { frameworkKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useFrameworks() {
  return useQuery({
    queryKey: frameworkKeys.list(),
    queryFn: fetchFrameworks,
    staleTime: 300_000,
  });
}

export function useFrameworkPrefs() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const enabled = hydrated ? !!token : false;
  return useQuery({
    queryKey: ["framework-prefs"],
    queryFn: fetchFrameworkPrefs,
    staleTime: 60_000,
    enabled,
    retry: 1,
  });
}
