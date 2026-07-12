"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Position } from "@/lib/services/portfolio";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface PortfolioTableProps {
  positions: Position[];
  isLoading?: boolean;
}

export function PortfolioTable({ positions, isLoading }: PortfolioTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <div className="p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Holdings
          </h2>
        </div>
        <div className="space-y-3 p-4 pt-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!positions.length) {
    return (
      <div className="rounded-lg border">
        <div className="p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Holdings
          </h2>
        </div>
        <div className="p-4 pt-0">
          <p className="text-sm text-muted-foreground">
            No positions yet. Start trading to build your portfolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-sm font-medium text-muted-foreground">Holdings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Ticker</th>
              <th className="text-right p-3 font-medium">Quantity</th>
              <th className="text-right p-3 font-medium">Avg Price</th>
              <th className="text-right p-3 font-medium">Current Price</th>
              <th className="text-right p-3 font-medium">Market Value</th>
              <th className="text-right p-3 font-medium">P&L</th>
              <th className="text-right p-3 font-medium">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const marketValue = pos.quantity * pos.currentPriceCents;
              const costBasis = pos.quantity * pos.avgPriceCents;
              const pl = marketValue - costBasis;
              const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
              const plColor = pl >= 0 ? "text-emerald-500" : "text-red-500";

              return (
                <tr key={pos.ticker} className="border-b last:border-0">
                  <td className="p-3 font-medium">{pos.ticker}</td>
                  <td className="p-3 text-right">{pos.quantity.toFixed(4)}</td>
                  <td className="p-3 text-right">
                    {formatCents(pos.avgPriceCents)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCents(pos.currentPriceCents)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCents(marketValue)}
                  </td>
                  <td className={`p-3 text-right ${plColor}`}>
                    {formatCents(pl)} ({plPct >= 0 ? "+" : ""}
                    {plPct.toFixed(2)}%)
                  </td>
                  <td className="p-3 text-right">
                    {pos.complianceVerdict && (
                      <Badge
                        variant={
                          pos.complianceVerdict === "COMPLIANT"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {pos.complianceVerdict === "COMPLIANT"
                          ? "Halal"
                          : "Not Halal"}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
