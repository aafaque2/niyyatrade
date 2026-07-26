"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { FINANCIAL_GLOSSARY } from "@/lib/constants/glossary";
import { formatCents, formatDollarsCompact } from "@/lib/utils";
import { useFundamentals } from "@/lib/hooks/use-fundamentals";

interface KeyStatsProps {
  ticker: string;
}

function StatRow({
  label,
  value,
  tooltipTerm,
}: {
  label: string;
  value: string;
  tooltipTerm: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        <InfoTooltip
          term={label}
          definition={
            FINANCIAL_GLOSSARY[tooltipTerm] ?? "No description available."
          }
        />
      </span>
      <span className="text-xs font-medium font-mono text-foreground">
        {value}
      </span>
    </div>
  );
}

export function KeyStats({ ticker }: KeyStatsProps) {
  const { data, isLoading } = useFundamentals(ticker);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <h2 className="mb-3 text-xs font-medium text-muted-foreground">
          Key Statistics
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currency = data.currency ?? "USD";

  const formatDividend = (val: number | null) => {
    if (val === null) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatVolume = (val: number | null) => {
    if (val === null) return "N/A";
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(val);
  };

  const formatPrice = (val: number | null) => {
    if (val === null) return "N/A";
    return formatCents(Math.round(val * 100), currency);
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h2 className="mb-3 text-xs font-medium text-muted-foreground">
        Key Statistics
      </h2>
      <div className="divide-y divide-border">
        <StatRow
          label="Market Cap"
          value={formatDollarsCompact(data.marketCap, currency)}
          tooltipTerm="market-cap"
        />
        <StatRow
          label="P/E Ratio"
          value={data.peRatio ? data.peRatio.toFixed(2) : "N/A"}
          tooltipTerm="pe-ratio"
        />
        <StatRow
          label="Dividend Yield"
          value={formatDividend(data.dividendYield)}
          tooltipTerm="dividend-yield"
        />
        <StatRow
          label="Volume"
          value={formatVolume(data.volume)}
          tooltipTerm="volume"
        />
        <StatRow
          label="52W High"
          value={formatPrice(data.week52High)}
          tooltipTerm="52w-high"
        />
        <StatRow
          label="52W Low"
          value={formatPrice(data.week52Low)}
          tooltipTerm="52w-low"
        />
        <StatRow
          label="Total Revenue"
          value={formatDollarsCompact(data.totalRevenue, currency)}
          tooltipTerm="market-cap"
        />
        <StatRow
          label="Sector"
          value={data.sector}
          tooltipTerm="sector"
        />
        {data.industry && (
          <StatRow
            label="Industry"
            value={data.industry}
            tooltipTerm="sector"
          />
        )}
      </div>
    </div>
  );
}
