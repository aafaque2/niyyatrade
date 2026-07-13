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
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
        ))}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border bg-surface p-4">
        <p className="text-xs text-muted-foreground">Total Value</p>
        <p className="mt-1 text-2xl font-semibold font-mono tracking-tight">
          {totalValueCents != null ? formatCents(totalValueCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border bg-surface p-4">
        <p className="text-xs text-muted-foreground">Buying Power</p>
        <p className="mt-1 text-2xl font-semibold font-mono tracking-tight">
          {buyingPowerCents != null ? formatCents(buyingPowerCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border bg-surface p-4">
        <p className="text-xs text-muted-foreground">Compliance Score</p>
        <p
          className={`mt-1 text-2xl font-semibold font-mono tracking-tight ${
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
