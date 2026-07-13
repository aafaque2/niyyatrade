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
      <Badge variant="default" className="bg-success/10 text-success text-[10px]">
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

function ReturnDisplay({ cents, percent }: { cents: number; percent: number }) {
  const positive = cents >= 0;
  return (
    <span
      className={`font-mono text-xs ${
        positive ? "text-success" : "text-danger"
      }`}
    >
      {formatCents(cents)} ({formatPercent(percent / 100)})
    </span>
  );
}

export function PortfolioTable({
  positions,
  isLoading,
}: PortfolioTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
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
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Asset
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Avg Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Current
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Return
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr
                key={pos.ticker}
                className="border-b border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/assets/${pos.ticker}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {pos.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {formatQuantity(pos.quantity)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {formatCents(pos.avgPriceCents)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {formatCents(pos.currentPriceCents)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ReturnDisplay
                    cents={pos.returnCents}
                    percent={pos.returnPercent}
                  />
                </td>
                <td className="px-4 py-3 text-center">
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
