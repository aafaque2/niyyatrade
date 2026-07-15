"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatPercent } from "@/lib/utils";
import type { Position } from "@/lib/services/portfolio";

interface TopHoldingsProps {
  positions: Position[];
  isLoading?: boolean;
}

export function TopHoldings({ positions, isLoading }: TopHoldingsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">
          Top Holdings
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) return null;

  const sorted = [...positions]
    .sort((a, b) => b.quantity * b.currentPriceCents - a.quantity * a.currentPriceCents)
    .slice(0, 5);

  const totalMarketValue = sorted.reduce(
    (sum, p) => sum + p.quantity * p.currentPriceCents,
    0,
  );

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h2 className="mb-3 text-xs font-medium text-muted-foreground">
        Top Holdings
      </h2>
      <div className="space-y-1">
        {sorted.map((pos) => {
          const value = pos.quantity * pos.currentPriceCents;
          const weight = totalMarketValue > 0 ? (value / totalMarketValue) * 100 : 0;
          return (
            <div key={pos.ticker}>
              <Link
                href={`/assets/${pos.ticker}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-mono text-primary">{pos.ticker}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatPercent(weight / 100)}
                  </span>
                </div>
                <span className="text-xs font-mono text-foreground">
                  {formatCents(value)}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
