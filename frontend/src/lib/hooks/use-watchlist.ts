"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/services/watchlist";

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
    staleTime: 30_000,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => addToWatchlist(ticker),
    onSuccess: (item) => {
      toast.success(`${item.ticker} added to watchlist`);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add to watchlist");
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => removeFromWatchlist(ticker),
    onSuccess: (_data, ticker) => {
      toast.success(`${ticker} removed from watchlist`);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to remove from watchlist");
    },
  });
}
