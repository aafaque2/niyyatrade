import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceGaugeProps {
  score: number;
  totalPositions: number;
  compliantCount: number;
  frameworkLabel?: string;
  isLoading?: boolean;
}

export function ComplianceGauge({
  score,
  totalPositions,
  compliantCount,
  frameworkLabel,
  isLoading,
}: ComplianceGaugeProps) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Portfolio Compliance
        {frameworkLabel && (
          <span className="ml-1.5 text-muted-foreground/60">
            · {frameworkLabel}
          </span>
        )}
      </p>
      {isLoading ? (
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-[88px] w-[88px] rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="#232B35"
              strokeWidth="6"
            />
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke={getColor(score)}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <text
              x="44"
              y="44"
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              className="text-lg font-semibold font-mono"
            >
              {score}%
            </text>
          </svg>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-light" />
              <span>{compliantCount} Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger" />
              <span>{totalPositions - compliantCount} Non-Compliant</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
