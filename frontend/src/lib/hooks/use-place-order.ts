"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { placeOrder } from "@/lib/services/portfolio";
import { portfolioKeys, quoteKeys } from "@/lib/query-keys";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Handle axios errors with response data
    const maybeAxios = err as unknown as { response?: { data?: { error?: { message?: string; details?: unknown } } } };
    const apiMsg = maybeAxios.response?.data?.error?.message;
    if (typeof apiMsg === 'string' && apiMsg.length > 0) return apiMsg;
    return err.message;
  }
  return "Order failed";
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: placeOrder,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
      queryClient.invalidateQueries({
        queryKey: quoteKeys.detail(variables.assetTicker),
      });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      const isLimit = variables.orderType === "LIMIT";
      toast.success(isLimit ? "Limit order placed" : "Order executed", {
        description: `${variables.side} ${variables.quantity} ${variables.assetTicker.toUpperCase()}${isLimit ? " — pending" : ""}`,
      });
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      // Map common backend messages to user-friendly
      if (msg.toLowerCase().includes("insufficient")) {
        toast.error("Insufficient buying power", { description: msg });
      } else if (msg.toLowerCase().includes("short selling")) {
        toast.error("Short selling not allowed", { description: msg });
      } else if (msg.toLowerCase().includes("limit price")) {
        toast.error("Invalid limit price", { description: msg });
      } else {
        toast.error("Order failed", { description: msg });
      }
    },
  });
}
