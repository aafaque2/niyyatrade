"use client";

import { cn } from "@/lib/utils";

const EXCHANGE_COLORS: Record<string, string> = {
  "NASDAQ": "text-blue-500 bg-blue-500/10",
  "NYSE": "text-indigo-500 bg-indigo-500/10",
  "NSE": "text-emerald-500 bg-emerald-500/10",
  "BSE": "text-orange-500 bg-orange-500/10",
  "LSE": "text-purple-500 bg-purple-500/10",
  "TSE": "text-red-500 bg-red-500/10",
  "TSX": "text-red-500 bg-red-500/10",
  "ASX": "text-yellow-600 bg-yellow-500/10",
  "XETRA": "text-blue-600 bg-blue-500/10",
  "Frankfurt Stock Exchange": "text-blue-600 bg-blue-500/10",
  "London Stock Exchange": "text-purple-500 bg-purple-500/10",
  "Tokyo Stock Exchange": "text-red-500 bg-red-500/10",
  "Hong Kong Stock Exchange": "text-rose-500 bg-rose-500/10",
  "Singapore Exchange": "text-teal-500 bg-teal-500/10",
  "S&P 500": "text-blue-500 bg-blue-500/10",
  "NYSE American": "text-indigo-500 bg-indigo-500/10",
};

const DEFAULT_COLOR = "text-muted-foreground bg-muted";

export function ExchangeBadge({
  exchange,
  className,
}: {
  exchange: string | null;
  className?: string;
}) {
  if (!exchange) return null;

  const colorClass = EXCHANGE_COLORS[exchange] ?? DEFAULT_COLOR;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        colorClass,
        className,
      )}
    >
      {exchange}
    </span>
  );
}
