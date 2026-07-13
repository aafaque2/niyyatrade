interface ComplianceGaugeProps {
  score: number;
  totalPositions: number;
  compliantCount: number;
}

export function ComplianceGauge({
  score,
  totalPositions,
  compliantCount,
}: ComplianceGaugeProps) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="rounded-lg border bg-surface p-4">
      <p className="text-xs text-muted-foreground">Portfolio Compliance</p>
      <div className="mt-2 flex items-center gap-4">
        <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="oklch(0.269 0.007 285.786)"
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
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
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
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>{compliantCount} Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span>{totalPositions - compliantCount} Non-Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
