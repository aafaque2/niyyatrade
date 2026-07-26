"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatQuantity, formatPercent } from "@/lib/utils";
import type { Position } from "@/lib/services/portfolio";

interface PortfolioTableProps {
  positions: Position[];
  isLoading?: boolean;
}

function ComplianceBadge({ verdict }: { verdict?: string }) {
  if (!verdict) return null;

  if (verdict === "COMPLIANT") {
    return (
      <Badge variant="default" className="bg-emerald-subtle text-emerald-light border-emerald/20 text-[10px]">
        Compliant
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-[10px]">
      Non-Compliant
    </Badge>
  );
}

function ReturnDisplay({ cents, percent, currency }: { cents: number; percent: number; currency?: string }) {
  const positive = cents >= 0;
  return (
    <span
      className={`font-mono text-xs ${
        positive ? "text-emerald-light" : "text-danger"
      }`}
    >
      {formatCents(cents, currency)} ({formatPercent(percent / 100)})
    </span>
  );
}

export function PortfolioTable({
  positions,
  isLoading,
}: PortfolioTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Asset
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">
                Qty
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">
                Avg Price
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Current
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Return
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr
                key={pos.ticker}
                className="border-b border-border transition-colors hover:bg-surface-hover/50 last:border-b-0"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/assets/${pos.ticker}`}
                    className="font-semibold font-mono text-xs text-primary hover:underline"
                  >
                    {pos.ticker}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs hidden sm:table-cell">
                  {formatQuantity(pos.quantity)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs hidden md:table-cell">
                  {formatCents(pos.avgPriceCents, pos.currency)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {formatCents(pos.currentPriceCents, pos.currency)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ReturnDisplay
                    cents={pos.returnCents}
                    percent={pos.returnPercent}
                    currency={pos.currency}
                  />
                </td>
                <td className="px-4 py-2.5 text-center hidden md:table-cell">
                  <ComplianceBadge verdict={pos.complianceVerdict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
