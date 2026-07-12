"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioSummaryProps {
  totalValueCents?: number;
  buyingPowerCents?: number;
  overallComplianceScore?: number;
  isLoading?: boolean;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
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

  const complianceColor =
    overallComplianceScore != null
      ? overallComplianceScore >= 80
        ? "text-emerald-500"
        : overallComplianceScore >= 50
          ? "text-amber-500"
          : "text-red-500"
      : "";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total Value</p>
        <p className="text-2xl font-semibold">
          {totalValueCents != null ? formatCents(totalValueCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Buying Power</p>
        <p className="text-2xl font-semibold">
          {buyingPowerCents != null ? formatCents(buyingPowerCents) : "--"}
        </p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Compliance Score</p>
        <p className={`text-2xl font-semibold ${complianceColor}`}>
          {overallComplianceScore != null
            ? `${overallComplianceScore}%`
            : "--"}
        </p>
      </div>
    </div>
  );
}
