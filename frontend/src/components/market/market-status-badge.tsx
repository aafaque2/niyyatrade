"use client";

import { cn } from "@/lib/utils";

type MarketStatus = "OPEN" | "CLOSED" | "PRE_MARKET" | "POST_MARKET" | "UNKNOWN";

const STATUS_CONFIG: Record<MarketStatus, { label: string; dot: string; text: string }> = {
  OPEN: { label: "Market Open", dot: "bg-emerald-500", text: "text-emerald-500" },
  CLOSED: { label: "Market Closed", dot: "bg-zinc-400", text: "text-zinc-400" },
  PRE_MARKET: { label: "Pre-Market", dot: "bg-amber-500", text: "text-amber-500" },
  POST_MARKET: { label: "After Hours", dot: "bg-amber-500", text: "text-amber-500" },
  UNKNOWN: { label: "Status Unknown", dot: "bg-zinc-400", text: "text-zinc-400" },
};

export function MarketStatusBadge({
  status,
  className,
}: {
  status: MarketStatus | undefined;
  className?: string;
}) {
  if (!status) return null;

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium",
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
