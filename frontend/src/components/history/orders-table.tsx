"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatQuantity } from "@/lib/utils";
import type { OrderHistoryItem } from "@/lib/services/history";

interface OrdersTableProps {
  items: OrderHistoryItem[];
}

const STATUS_COLORS: Record<string, string> = {
  EXECUTED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function OrdersTable({ items }: OrdersTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                Status
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

              return (
                <tr
                  key={order.id}
                  className="border-b border-border transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/assets/${order.ticker}`}
                      className="text-xs font-medium text-foreground hover:text-primary"
                    >
                      {order.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={order.side === "BUY" ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {order.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatQuantity(order.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {order.priceCents != null
                      ? formatCents(order.priceCents)
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {order.priceCents != null
                      ? formatCents(order.priceCents * order.quantity)
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
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
