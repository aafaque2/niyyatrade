"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateFrameworkPrefs } from "@/lib/services/identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FrameworkOverrideForm() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
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
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No active framework set. Compliance rules cannot be customized.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium">Debt Threshold</h3>
        <p className="text-xs text-muted-foreground">
          Maximum debt-to-assets ratio (default: 33.33%)
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={debtThreshold}
            onChange={(e) => setDebtThreshold(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium">Interest Income Threshold</h3>
        <p className="text-xs text-muted-foreground">
          Maximum interest-to-revenue ratio (default: 5%)
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={interestThreshold}
            onChange={(e) => setInterestThreshold(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        size="sm"
      >
        {mutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Overrides"}
      </Button>
    </div>
  );
}
