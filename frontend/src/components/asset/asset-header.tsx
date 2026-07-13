"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatChange } from "@/lib/utils";

interface AssetHeaderProps {
  ticker: string;
  companyName?: string;
  priceCents?: number;
  changePercent?: number;
  isLoading: boolean;
}

export function AssetHeader({
  ticker,
  companyName,
  priceCents,
  changePercent,
  isLoading,
}: AssetHeaderProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  const change = changePercent !== undefined ? formatChange(changePercent) : null;

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ticker.toUpperCase()}
        </h1>
        {companyName && (
          <span className="text-sm text-muted-foreground">{companyName}</span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        {priceCents !== undefined && (
          <span className="text-3xl font-semibold tracking-tight font-mono">
            {formatCents(priceCents)}
          </span>
        )}
        {change && (
          <span
            className={`text-sm font-medium font-mono ${
              change.positive
                ? "text-success"
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
