"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/lib/hooks/use-quote";
import { usePlaceOrder } from "@/lib/hooks/use-place-order";
import { formatCents } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthInterceptModal } from "@/components/auth/auth-intercept-modal";

export function OrderTicket({ ticker }: { ticker: string }) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuote(ticker);
  const { mutate, isPending, isSuccess, error } = usePlaceOrder();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const priceCents = quote?.priceCents ?? 0;
  const currency = quote?.currency ?? "USD";
  const qty = parseFloat(quantity) || 0;
  const effectivePriceCents =
    orderType === "LIMIT" ? Math.round(parseFloat(limitPrice || "0") * 100) : priceCents;
  const estimatedCost = qty * effectivePriceCents;

  const handleSubmit = () => {
    if (qty <= 0) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    mutate({
      assetTicker: ticker,
      side,
      quantity: qty,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h2 className="mb-4 text-xs font-medium text-muted-foreground">Trade</h2>

      <Tabs
        value={side}
        onValueChange={(v) => setSide(v as "BUY" | "SELL")}
        className="mb-4"
        aria-label={`Order side: ${side === "BUY" ? "Buy" : "Sell"}`}
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="BUY"
            className="flex-1 data-[active]:text-emerald-light"
            aria-label="Buy order"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger value="SELL" className="flex-1" aria-label="Sell order">
            Sell
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            orderType === "MARKET"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            orderType === "LIMIT"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          Limit
        </button>
      </div>

      <div className="space-y-3">
        {quoteLoading ? (
          <Skeleton className="h-4 w-28" />
        ) : quoteError ? (
          <p className="text-sm text-destructive">
            Quote unavailable — data not found for this ticker.
          </p>
        ) : (
          <p className="text-sm">
            {orderType === "MARKET" ? "Market price:" : "Last price:"}{" "}
            <span className="font-medium font-mono text-foreground">
              {priceCents > 0 ? formatCents(priceCents, currency) : "N/A"}
            </span>
          </p>
        )}

        {orderType === "LIMIT" && (
          <div>
            <label htmlFor="limit-price" className="text-xs text-muted-foreground">
              Limit Price
            </label>
            <Input
              id="limit-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="mt-1 bg-background"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="order-quantity" className="text-xs text-muted-foreground">
            Quantity
          </label>
          <Input
            id="order-quantity"
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 bg-background"
            required
          />
        </div>

        {qty > 0 && effectivePriceCents > 0 && (
          <p className="text-sm text-muted-foreground">
            Estimated {side === "BUY" ? "cost" : "proceeds"}:{" "}
            <span className="font-medium font-mono text-foreground">
              {formatCents(estimatedCost, currency)}
            </span>
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {(error as Error).message ?? "Order failed"}
          </p>
        )}

        {isSuccess && (
          <p className="text-xs text-emerald-light">Order executed successfully!</p>
        )}

        <Button
          className={`w-full ${
            side === "BUY"
              ? "bg-primary hover:bg-emerald-muted text-white"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          }`}
          variant={side === "BUY" ? "default" : "destructive"}
          disabled={qty <= 0 || isPending || effectivePriceCents <= 0}
          onClick={handleSubmit}
        >
          {isPending
            ? "Submitting..."
            : `${side === "BUY" ? "Buy" : "Sell"} ${ticker.toUpperCase()}`}
        </Button>
      </div>

      <AuthInterceptModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        ticker={ticker}
      />
    </div>
  );
}
