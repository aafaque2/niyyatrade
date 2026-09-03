"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/lib/services/watchlist";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useWatchlist() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
    staleTime: 30_000,
    enabled: hydrated ? !!token : false,
    retry: 1,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => addToWatchlist(ticker),
    onMutate: async (ticker: string) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]);
      const upper = ticker.toUpperCase();
      if (previous && !previous.some((i) => i.ticker.toUpperCase() === upper)) {
        queryClient.setQueryData<WatchlistItem[]>(["watchlist"], [
          ...previous,
          {
            id: `optimistic-${upper}-${Date.now()}`,
            ticker: upper,
            name: upper,
            sector: "",
            addedAt: new Date().toISOString(),
          },
        ]);
      }
      return { previous };
    },
    onSuccess: (item) => {
      toast.success(`${item.ticker} added to watchlist`);
    },
    onError: (err: Error, _ticker, context) => {
      const ctx = context as { previous?: WatchlistItem[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(["watchlist"], ctx.previous);
      }
      toast.error(err.message ?? "Failed to add to watchlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => removeFromWatchlist(ticker),
    onMutate: async (ticker: string) => {
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]);
      const upper = ticker.toUpperCase();
      if (previous) {
        queryClient.setQueryData<WatchlistItem[]>(
          ["watchlist"],
          previous.filter((i) => i.ticker.toUpperCase() !== upper),
        );
      }
      return { previous };
    },
    onSuccess: (_data, ticker) => {
      toast.success(`${ticker} removed from watchlist`);
    },
    onError: (err: Error, _ticker, context) => {
      const ctx = context as { previous?: WatchlistItem[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(["watchlist"], ctx.previous);
      }
      toast.error(err.message ?? "Failed to remove from watchlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
