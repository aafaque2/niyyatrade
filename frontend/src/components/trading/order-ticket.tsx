"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/lib/hooks/use-quote";
import { usePlaceOrder } from "@/lib/hooks/use-place-order";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { formatCents } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthInterceptModal } from "@/components/auth/auth-intercept-modal";

const HALAL_SLUG = "halal-aaoifi";

export function OrderTicket({ ticker }: { ticker: string }) {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSide, setPendingSide] = useState<"BUY" | "SELL">("BUY");
  const [showShortConfirm, setShowShortConfirm] = useState(false);
  const [halalWarning, setHalalWarning] = useState(false);
  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuote(ticker);
  const { data: portfolio } = usePortfolio();
  const { mutate, isPending, isSuccess, error } = usePlaceOrder();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const priceCents = quote?.priceCents ?? 0;
  const currency = quote?.currency ?? "USD";
  const qty = parseFloat(quantity) || 0;
  const effectivePriceCents =
    orderType === "LIMIT" ? Math.round(parseFloat(limitPrice || "0") * 100) : priceCents;
  const estimatedCost = qty * effectivePriceCents;

  const position = portfolio?.positions?.find((p) => p.ticker === ticker);
  const heldQty = position?.quantity ?? 0;
  const halalBlocksShort = portfolio?.activeFrameworkSlug === HALAL_SLUG;

  const doMutate = (side: "BUY" | "SELL") => {
    setPendingSide(side);
    mutate({
      assetTicker: ticker,
      side,
      quantity: qty,
      orderType,
      ...(orderType === "LIMIT" && effectivePriceCents > 0
        ? { limitPriceCents: effectivePriceCents }
        : {}),
    });
  };

  const handleSubmit = (side: "BUY" | "SELL") => {
    if (qty <= 0) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (side === "SELL" && qty > heldQty) {
      if (halalBlocksShort) {
        setHalalWarning(true);
        setShowShortConfirm(false);
        return;
      }
      setShowShortConfirm(true);
      setHalalWarning(false);
      return;
    }
    doMutate(side);
  };

  const confirmShortSell = () => {
    setShowShortConfirm(false);
    doMutate("SELL");
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h2 className="mb-4 text-xs font-medium text-muted-foreground">Trade</h2>

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
            Estimated cost:{" "}
            <span className="font-medium font-mono text-foreground">
              {formatCents(estimatedCost, currency)}
            </span>
          </p>
        )}

        {halalWarning && (
          <p className="text-xs text-warning">
            Short selling is not permitted under the Halal (AAOIFI) framework.
          </p>
        )}

        {showShortConfirm && (
          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              You don&apos;t hold any {ticker.toUpperCase()} shares. Are you sure you want to short sell?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setShowShortConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-destructive text-white hover:bg-red-600 text-xs"
                onClick={confirmShortSell}
              >
                Confirm Short Sell
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {(error as Error).message ?? "Order failed"}
          </p>
        )}

        {isSuccess &&
          (orderType === "LIMIT" ? (
            <p className="text-xs text-amber-400">
              Limit order placed — will execute when price reaches{" "}
              <span className="font-mono">
                {formatCents(effectivePriceCents, currency)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-emerald-light">
              Order executed successfully!
            </p>
          ))}

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-primary text-white hover:bg-emerald-muted"
            disabled={qty <= 0 || isPending || effectivePriceCents <= 0}
            onClick={() => handleSubmit("BUY")}
          >
            {isPending && pendingSide === "BUY" ? "Submitting..." : `Buy ${ticker.toUpperCase()}`}
          </Button>
          <Button
            className="flex-1 bg-destructive text-white hover:bg-red-600"
            disabled={qty <= 0 || isPending || effectivePriceCents <= 0}
            onClick={() => handleSubmit("SELL")}
          >
            {isPending && pendingSide === "SELL" ? "Submitting..." : `Sell ${ticker.toUpperCase()}`}
          </Button>
        </div>
      </div>

      <AuthInterceptModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        ticker={ticker}
      />
    </div>
  );
}
