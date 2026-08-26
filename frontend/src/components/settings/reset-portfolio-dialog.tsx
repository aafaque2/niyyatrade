"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPortfolio } from "@/lib/services/identity";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getCurrencyConfig } from "@/lib/config/currencies";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function formatBalance(currencyCode: string): string {
  const config = getCurrencyConfig(currencyCode);
  if (!config) return "$100,000.00";
  const amount = config.startingBalanceCents / 100;
  return `${config.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ResetPortfolioDialog() {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();
  const currency = useAuthStore((s) => s.user?.currency ?? "USD");
  const balance = formatBalance(currency);

  const mutation = useMutation({
    mutationFn: resetPortfolio,
    onSuccess: () => {
      toast.success(`Portfolio reset to ${balance}`);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setConfirming(false);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to reset portfolio");
    },
  });

  if (confirming) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-surface/50 p-4 space-y-3">
        <p className="text-xs text-destructive font-medium">
          Are you sure? This will reset your balance to {balance} and clear all
          positions and order history. This cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Resetting..." : "Yes, reset portfolio"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/15 bg-surface/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-destructive">
          Reset Virtual Portfolio
        </h3>
        <p className="text-xs text-muted-foreground">
          Clear all positions and reset your balance to {balance}.
        </p>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Reset Portfolio
      </Button>
    </div>
  );
}
