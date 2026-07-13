"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getQuote } from "@/lib/services/market-data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents, formatPercent } from "@/lib/utils";
import { useRemoveFromWatchlist } from "@/lib/hooks/use-watchlist";
import { X } from "lucide-react";
import type { WatchlistItem } from "@/lib/services/watchlist";

interface WatchlistTableProps {
  items: WatchlistItem[];
}

function PriceCell({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => getQuote(ticker),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <Skeleton className="h-4 w-20" />;
  }

  if (!data) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  const positive = data.changePercent >= 0;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs">{formatCents(data.priceCents)}</span>
      <span
        className={`font-mono text-[10px] ${
          positive ? "text-success" : "text-danger"
        }`}
      >
        {positive ? "+" : ""}
        {formatPercent(data.changePercent)}
      </span>
    </div>
  );
}

export function WatchlistTable({ items }: WatchlistTableProps) {
  const removeMutation = useRemoveFromWatchlist();

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Price / Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Sector
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/assets/${item.ticker}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {item.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.name}
                </td>
                <td className="px-4 py-3">
                  <PriceCell ticker={item.ticker} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.sector}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.ticker)}
                    disabled={removeMutation.isPending}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label={`Remove ${item.ticker}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
