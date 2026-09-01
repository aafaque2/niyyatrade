"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder } from "@/lib/services/portfolio";
import { portfolioKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Limit order cancelled");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Failed to cancel order";
      toast.error(msg);
    },
  });
}
