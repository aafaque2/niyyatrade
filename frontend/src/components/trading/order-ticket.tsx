"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/lib/hooks/use-quote";
import { usePlaceOrder } from "@/lib/hooks/use-place-order";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function OrderTicket({ ticker }: { ticker: string }) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const { data: quote, isLoading: quoteLoading } = useQuote(ticker);
  const { mutate, isPending, isSuccess, error } = usePlaceOrder();

  const priceCents = quote?.priceCents ?? 0;
  const qty = parseFloat(quantity) || 0;
  const estimatedCost = qty * priceCents;

  const handleSubmit = () => {
    if (qty <= 0) return;
    mutate({
      assetTicker: ticker,
      side,
      quantity: qty,
    });
  };

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">Trade</h2>

      <Tabs
        value={side}
        onValueChange={(v) => setSide(v as "BUY" | "SELL")}
        className="mb-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="BUY" className="flex-1">
            Buy
          </TabsTrigger>
          <TabsTrigger value="SELL" className="flex-1">
            Sell
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {quoteLoading ? (
          <Skeleton className="h-4 w-28" />
        ) : (
          <p className="text-sm">
            Current price:{" "}
            <span className="font-medium">
              {priceCents > 0 ? formatCents(priceCents) : "N/A"}
            </span>
          </p>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Quantity</label>
          <Input
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        {qty > 0 && priceCents > 0 && (
          <p className="text-sm text-muted-foreground">
            Estimated {side === "BUY" ? "cost" : "proceeds"}:{" "}
            <span className="font-medium text-foreground">
              {formatCents(estimatedCost)}
            </span>
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {(error as Error).message ?? "Order failed"}
          </p>
        )}

        {isSuccess && (
          <p className="text-xs text-emerald-500">
            Order executed successfully!
          </p>
        )}

        <Button
          className="w-full"
          variant={side === "BUY" ? "default" : "destructive"}
          disabled={qty <= 0 || isPending || priceCents <= 0}
          onClick={handleSubmit}
        >
          {isPending
            ? "Submitting..."
            : `${side === "BUY" ? "Buy" : "Sell"} ${ticker.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
