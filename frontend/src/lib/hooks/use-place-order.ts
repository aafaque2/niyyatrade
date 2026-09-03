"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { placeOrder, type CreateOrderPayload, type Portfolio } from "@/lib/services/portfolio";
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
    onMutate: async (variables: CreateOrderPayload) => {
      await queryClient.cancelQueries({ queryKey: portfolioKeys.detail() });
      const previous = queryClient.getQueryData<Portfolio>(portfolioKeys.detail());

      if (previous) {
        const ticker = variables.assetTicker.toUpperCase();
        const cachedQuote = queryClient.getQueryData<{ priceCents?: number }>(
          quoteKeys.detail(ticker),
        );
        const effectivePrice =
          variables.limitPriceCents ?? cachedQuote?.priceCents ?? 0;
        const estimated = Math.round(variables.quantity * effectivePrice);
        const isLimit = variables.orderType === "LIMIT";

        const optimisticOrder = {
          id: `optimistic-${Date.now()}`,
          ticker,
          side: variables.side,
          quantity: variables.quantity,
          priceCents: effectivePrice,
          status: isLimit ? "PENDING" : "EXECUTED",
          createdAt: new Date().toISOString(),
        };

        const positions = [...previous.positions];
        const idx = positions.findIndex((p) => p.ticker.toUpperCase() === ticker);
        if (variables.side === "BUY" && effectivePrice > 0) {
          if (idx >= 0) {
            const existing = positions[idx];
            const newQty = existing.quantity + variables.quantity;
            // Weighted avg price
            const newAvg = Math.round(
              (existing.quantity * existing.avgPriceCents + variables.quantity * effectivePrice) /
                Math.max(newQty, 1e-9),
            );
            positions[idx] = {
              ...existing,
              quantity: newQty,
              avgPriceCents: newAvg,
              currentPriceCents: effectivePrice,
            };
          } else {
            positions.push({
              ticker,
              quantity: variables.quantity,
              avgPriceCents: effectivePrice,
              currentPriceCents: effectivePrice,
              returnCents: 0,
              returnPercent: 0,
            });
          }
        } else if (variables.side === "SELL") {
          if (idx >= 0) {
            const existing = positions[idx];
            const newQty = existing.quantity - variables.quantity;
            if (newQty <= 0) {
              positions.splice(idx, 1);
            } else {
              positions[idx] = { ...existing, quantity: newQty };
            }
          }
        }

        queryClient.setQueryData<Portfolio>(portfolioKeys.detail(), {
          ...previous,
          buyingPowerCents:
            effectivePrice > 0
              ? variables.side === "BUY"
                ? Number(previous.buyingPowerCents) - estimated
                : Number(previous.buyingPowerCents) + estimated
              : previous.buyingPowerCents,
          positions,
          recentOrders: [optimisticOrder, ...previous.recentOrders].slice(0, 5),
        });
      }

      return { previous };
    },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
    },
    onError: (err: unknown, _variables, context) => {
      const ctx = context as { previous?: Portfolio } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData<Portfolio>(portfolioKeys.detail(), ctx.previous);
      }
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
