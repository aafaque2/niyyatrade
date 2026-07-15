"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/utils";

interface PortfolioSummaryProps {
  totalValueCents?: number;
  buyingPowerCents?: number;
  overallComplianceScore?: number;
  isLoading?: boolean;
}

export function PortfolioSummary({
  totalValueCents,
  buyingPowerCents,
  overallComplianceScore,
  isLoading,
}: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-36" />
          </div>
        ))}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-light";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">Total Value</p>
        <p className="mt-1.5 text-2xl font-semibold font-mono tracking-tight">
          {totalValueCents != null ? formatCents(totalValueCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">Buying Power</p>
        <p className="mt-1.5 text-2xl font-semibold font-mono tracking-tight">
          {buyingPowerCents != null ? formatCents(buyingPowerCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">Compliance Score</p>
        <p
          className={`mt-1.5 text-2xl font-semibold font-mono tracking-tight ${
            overallComplianceScore != null
              ? getScoreColor(overallComplianceScore)
              : ""
          }`}
        >
          {overallComplianceScore != null
            ? `${overallComplianceScore}%`
            : "--"}
        </p>
      </div>
    </div>
  );
}
