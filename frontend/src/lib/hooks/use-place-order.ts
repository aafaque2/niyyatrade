"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeOrder } from "@/lib/services/portfolio";
import { portfolioKeys, quoteKeys } from "@/lib/query-keys";

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
    },
  });
}
