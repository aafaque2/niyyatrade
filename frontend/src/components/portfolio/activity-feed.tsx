"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatQuantity, deriveCurrencyFromTicker } from "@/lib/utils";
import { convertCents } from "@/lib/config/currencies";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { RecentOrder } from "@/lib/services/portfolio";

interface ActivityFeedProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ orders, isLoading }: ActivityFeedProps) {
  const userCurrency = useAuthStore((s) => s.user?.currency) ?? "USD";
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">
          Recent Activity
        </h2>
        <p className="text-xs text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h2 className="mb-3 text-xs font-medium text-muted-foreground">
        Recent Activity
      </h2>
      <div className="space-y-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-2">
              <Link
                href={`/assets/${order.ticker}`}
                className="text-xs font-semibold font-mono text-primary hover:underline"
              >
                {order.ticker}
              </Link>
              <Badge
                variant={order.side === "BUY" ? "default" : "destructive"}
                className="text-[10px]"
              >
                {order.side}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatQuantity(order.quantity)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">
                {(() => {
                  const assetCurrency = deriveCurrencyFromTicker(order.ticker);
                  const totalBase = order.priceCents * order.quantity;
                  const totalAsset = convertCents(totalBase, userCurrency, assetCurrency);
                  return formatCents(totalAsset, assetCurrency);
                })()}
              </span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">
                {timeAgo(order.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
