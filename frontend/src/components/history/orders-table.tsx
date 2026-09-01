"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents, formatQuantity, deriveCurrencyFromTicker } from "@/lib/utils";
import { convertCents } from "@/lib/config/currencies";
import type { OrderHistoryItem } from "@/lib/services/history";
import { useCancelOrder } from "@/lib/hooks/use-cancel-order";
import { useAuthStore } from "@/lib/stores/auth-store";
import { X, Loader2 } from "lucide-react";

interface OrdersTableProps {
  items: OrderHistoryItem[];
}

const STATUS_COLORS: Record<string, string> = {
  EXECUTED: "bg-emerald-subtle text-emerald-light border-emerald/20",
  PENDING: "bg-warning/10 text-warning border-warning/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export function OrdersTable({ items }: OrdersTableProps) {
  const { mutate: cancel, isPending: cancelPending } = useCancelOrder();
  const userCurrency = useAuthStore((s) => s.user?.currency) ?? "USD";
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Ticker
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">
                Qty
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">
                Price
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">
                Total
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => {
              const date = new Date(order.createdAt);
              const formattedDate = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const assetCurrency = deriveCurrencyFromTicker(order.ticker);
              // All stored prices are in base currency (user's INR/USD). Convert to asset currency for display.
              // Pending orders stored before fix were in asset currency, but they will be executed soon; converting them would be off by 100x,
              // but they are transient. New orders are correctly base.
              const displayPriceCents =
                order.priceCents != null ? convertCents(order.priceCents, userCurrency, assetCurrency) : null;
              const displayTotalCents =
                displayPriceCents != null ? Math.round(displayPriceCents * order.quantity) : null;

              return (
                <tr
                  key={order.id}
                  className="border-b border-border transition-colors hover:bg-surface-hover/50 last:border-b-0"
                >
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/assets/${order.ticker}`}
                      className="text-xs font-semibold font-mono text-primary hover:underline"
                    >
                      {order.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={order.side === "BUY" ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {order.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs hidden sm:table-cell">
                    {formatQuantity(order.quantity)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs hidden md:table-cell">
                    {displayPriceCents != null ? formatCents(displayPriceCents, assetCurrency) : "--"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs hidden md:table-cell">
                    {displayTotalCents != null ? formatCents(displayTotalCents, assetCurrency) : "--"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {order.status === "PENDING" ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={cancelPending}
                        onClick={() => cancel(order.id)}
                      >
                        {cancelPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50">—</span>
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
