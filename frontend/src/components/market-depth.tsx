"use client";

import { useDepth } from "@/lib/hooks/use-depth";
import { useQuote } from "@/lib/hooks/use-quote";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DepthLevel } from "@/lib/services/market-data";

interface MarketDepthProps {
  ticker: string;
  currency?: string;
}

export function MarketDepth({ ticker, currency }: MarketDepthProps) {
  const { data: depth, isLoading } = useDepth(ticker);
  const { data: quote } = useQuote(ticker);

  if (isLoading) {
    return <Skeleton className="h-[320px] w-full rounded-lg" />;
  }

  if (!depth || depth.buy.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground">No depth data available</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Order book will appear when market data is available
        </p>
      </div>
    );
  }

  const bestBid = depth.buy.find((l) => l.quantity > 0)?.price ?? 0;
  const bestAsk = depth.sell.find((l) => l.quantity > 0)?.price ?? 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  const maxQty = Math.max(
    ...depth.buy.map((l) => l.quantity),
    ...depth.sell.map((l) => l.quantity),
    1,
  );

  const formatPrice = (p: number) => {
    if (currency === "INR") return `₹${p.toFixed(2)}`;
    return `$${p.toFixed(2)}`;
  };

  const formatQty = (q: number) => {
    if (q >= 1_00_000) return `${(q / 1_00_000).toFixed(1)}L`;
    if (q >= 1_000) return `${(q / 1_000).toFixed(1)}K`;
    return q.toString();
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Market Depth</h3>
        {spread > 0 && (
          <span className="text-xs text-muted-foreground">
            Spread: {formatPrice(spread)} ({spreadPct.toFixed(2)}%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Bid</span>
            <span>{formatQty(depth.totalBuyQuantity)} total</span>
          </div>
          <div className="space-y-0.5">
            {depth.buy
              .filter((l) => l.price > 0)
              .slice(0, 5)
              .reverse()
              .map((level, i) => (
                <DepthRow
                  key={`buy-${i}`}
                  level={level}
                  maxQty={maxQty}
                  side="buy"
                  formatPrice={formatPrice}
                  formatQty={formatQty}
                />
              ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Ask</span>
            <span>{formatQty(depth.totalSellQuantity)} total</span>
          </div>
          <div className="space-y-0.5">
            {depth.sell
              .filter((l) => l.price > 0)
              .slice(0, 5)
              .map((level, i) => (
                <DepthRow
                  key={`sell-${i}`}
                  level={level}
                  maxQty={maxQty}
                  side="sell"
                  formatPrice={formatPrice}
                  formatQty={formatQty}
                />
              ))}
          </div>
        </div>
      </div>

      {quote?.priceCents && (
        <div className="mt-3 border-t border-border pt-2 text-center">
          <span className="text-xs text-muted-foreground">
            Last: {formatPrice(quote.priceCents / 100)}
          </span>
        </div>
      )}
    </div>
  );
}

function DepthRow({
  level,
  maxQty,
  side,
  formatPrice,
  formatQty,
}: {
  level: DepthLevel;
  maxQty: number;
  side: "buy" | "sell";
  formatPrice: (p: number) => string;
  formatQty: (q: number) => string;
}) {
  const barWidth = maxQty > 0 ? (level.quantity / maxQty) * 100 : 0;

  return (
    <div className="relative flex items-center justify-between rounded px-1.5 py-1 text-xs">
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded opacity-10",
          side === "buy" ? "bg-emerald-500" : "bg-red-500",
        )}
        style={{ width: `${barWidth}%` }}
      />
      <span
        className={cn(
          "relative z-10 tabular-nums",
          side === "buy" ? "text-emerald-400" : "text-red-400",
        )}
      >
        {formatPrice(level.price)}
      </span>
      <span className="relative z-10 tabular-nums text-muted-foreground">
        {formatQty(level.quantity)}
      </span>
    </div>
  );
}
