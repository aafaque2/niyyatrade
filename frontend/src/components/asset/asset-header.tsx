"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatChange } from "@/lib/utils";
import { MarketStatusBadge } from "@/components/market/market-status-badge";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/lib/hooks/use-watchlist";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetHeaderProps {
  ticker: string;
  companyName?: string;
  priceCents?: number;
  changePercent?: number;
  currency?: string;
  marketStatus?: "OPEN" | "CLOSED" | "PRE_MARKET" | "POST_MARKET" | "UNKNOWN";
  isLoading: boolean;
}

export function AssetHeader({
  ticker,
  companyName,
  priceCents,
  changePercent,
  currency,
  marketStatus,
  isLoading,
}: AssetHeaderProps) {
  const { data: watchlist } = useWatchlist();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const isWatchlisted = watchlist?.some((w) => w.ticker.toUpperCase() === ticker.toUpperCase());
  const isPending = addMutation.isPending || removeMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  const change = changePercent !== undefined ? formatChange(changePercent) : null;

  const handleWatchlist = () => {
    if (isWatchlisted) removeMutation.mutate(ticker);
    else addMutation.mutate(ticker);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {ticker.toUpperCase()}
        </h1>
        {companyName && (
          <span className="text-sm text-muted-foreground">{companyName}</span>
        )}
        <MarketStatusBadge status={marketStatus} />
        <button
          onClick={handleWatchlist}
          disabled={isPending}
          className={cn(
            "ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
            isWatchlisted
              ? "border-primary bg-emerald-subtle text-emerald-light"
              : "border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary",
          )}
          aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Bookmark className={cn("h-3.5 w-3.5", isWatchlisted && "fill-current")} />
          {isWatchlisted ? "Watchlisted" : "Add to watchlist"}
        </button>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        {priceCents !== undefined && (
          <span className="text-3xl font-semibold tracking-tight font-mono">
            {formatCents(priceCents, currency)}
          </span>
        )}
        {change && (
          <span
            className={`text-sm font-medium font-mono ${
              change.positive
                ? "text-emerald-light"
                : "text-danger"
            }`}
          >
            {change.text}
          </span>
        )}
      </div>
    </div>
  );
}
