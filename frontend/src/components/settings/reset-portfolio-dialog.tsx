"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPortfolio } from "@/lib/services/identity";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ResetPortfolioDialog() {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: resetPortfolio,
    onSuccess: () => {
      toast.success("Portfolio reset to $100,000");
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
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
          Are you sure? This will reset your balance to $100,000 and clear all
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
          Clear all positions and reset your balance to $100,000.
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
