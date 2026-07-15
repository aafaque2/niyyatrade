"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateFrameworkPrefs } from "@/lib/services/identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FrameworkOverrideForm() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [debtThreshold, setDebtThreshold] = useState("33.33");
  const [interestThreshold, setInterestThreshold] = useState("5");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.activeFrameworkId) {
      const stored = localStorage.getItem(`overrides:${user.activeFrameworkId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number>;
        if (parsed.debtThreshold != null) setDebtThreshold(String(parsed.debtThreshold));
        if (parsed.interestThreshold != null) setInterestThreshold(String(parsed.interestThreshold));
      }
    }
  }, [user?.activeFrameworkId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const overrides: Record<string, number> = {};
      const debt = parseFloat(debtThreshold);
      const interest = parseFloat(interestThreshold);
      if (!isNaN(debt)) overrides.debtThreshold = debt;
      if (!isNaN(interest)) overrides.interestThreshold = interest;

      if (!user?.activeFrameworkId) throw new Error("No active framework");

      await updateFrameworkPrefs(user.activeFrameworkId, overrides);

      if (user?.activeFrameworkId) {
        localStorage.setItem(
          `overrides:${user.activeFrameworkId}`,
          JSON.stringify(overrides),
        );
      }
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (!user?.activeFrameworkId) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm text-muted-foreground">
        No active framework set. Compliance rules cannot be customised.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium">Framework Thresholds</h3>
        <p className="text-xs text-muted-foreground">
          Customise compliance thresholds for your active framework.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium">Debt Threshold</h4>
          <p className="text-[10px] text-muted-foreground">
            Maximum debt-to-assets ratio (default: 33.33%)
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="debt-threshold"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={debtThreshold}
              onChange={(e) => setDebtThreshold(e.target.value)}
              className="w-24 bg-background text-xs"
              aria-label="Debt Threshold"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium">Interest Income Threshold</h4>
          <p className="text-[10px] text-muted-foreground">
            Maximum interest-to-revenue ratio (default: 5%)
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="interest-threshold"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={interestThreshold}
              onChange={(e) => setInterestThreshold(e.target.value)}
              className="w-24 bg-background text-xs"
              aria-label="Interest Income Threshold"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        size="sm"
        className="bg-primary hover:bg-emerald-muted"
      >
        {mutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Overrides"}
      </Button>
    </div>
  );
}
