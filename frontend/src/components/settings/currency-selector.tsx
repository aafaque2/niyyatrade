"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateProfile } from "@/lib/services/identity";
import { CURRENCIES, getStartingBalance } from "@/lib/config/currencies";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function CurrencySelector() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(user?.currency ?? "USD");
  const [confirming, setConfirming] = useState(false);

  const currentCurrency = user?.currency ?? "USD";
  const isDirty = selected !== currentCurrency;

  const mutation = useMutation({
    mutationFn: () => updateProfile(user?.name ?? "", selected),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        setUser({
          ...user!,
          name: updatedUser.name,
          currency: updatedUser.currency,
        });
      }
      queryClient.clear();
      toast.success(`Currency changed to ${selected}. Portfolio has been reset.`);
      setConfirming(false);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update currency");
    },
  });

  if (confirming) {
    const newBalance = getStartingBalance(selected);
    const config = CURRENCIES.find((c) => c.code === selected);
    const formatted = config
      ? `${config.symbol}${(newBalance / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${newBalance}`;

    return (
      <div className="rounded-lg border border-destructive/20 bg-surface/50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-xs text-destructive font-medium">
              Change currency to {selected}?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This will reset your portfolio to {formatted} and clear all positions and order history. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Changing..." : "Yes, change currency"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirming(false);
              setSelected(currentCurrency);
            }}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Currency</h3>
        <p className="text-xs text-muted-foreground">
          Your display currency for prices and portfolio values.
        </p>
      </div>

      <div className="space-y-1.5">
        <select
          id="currency-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/50"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.name} ({c.code})
            </option>
          ))}
        </select>
        {isDirty && (
          <p className="text-[10px] text-warning">
            Changing currency will reset your portfolio and clear all trades.
          </p>
        )}
      </div>

      <Button
        onClick={() => setConfirming(true)}
        disabled={!isDirty}
        size="sm"
        className="bg-primary hover:bg-emerald-muted"
      >
        Change Currency
      </Button>
    </div>
  );
}
