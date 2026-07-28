"use client";

const INTERVAL_GROUPS = [
  [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "30m", value: "30m" },
  ],
  [
    { label: "1h", value: "1h" },
    { label: "1d", value: "1d" },
    { label: "1wk", value: "1wk" },
    { label: "1M", value: "1M" },
  ],
] as const;

const INTERVALS_BY_RESOLUTION: Record<string, Set<string>> = {
  "1D": new Set(["1m", "5m", "15m", "30m", "1h"]),
  "1W": new Set(["5m", "15m", "30m", "1h", "1d"]),
  "1M": new Set(["15m", "30m", "1h", "1d"]),
  "1Y": new Set(["1d", "1wk"]),
  ALL: new Set(["1d", "1wk", "1M"]),
};

const DEFAULT_INTERVAL: Record<string, string> = {
  "1D": "5m",
  "1W": "15m",
  "1M": "1d",
  "1Y": "1d",
  ALL: "1wk",
};

const MAX_VISIBLE_CANDLES: Record<string, number> = {
  "1m": 120,
  "5m": 120,
  "15m": 120,
  "30m": 120,
  "1h": 150,
  "1d": 200,
  "1wk": 150,
  "1M": 120,
};

export { DEFAULT_INTERVAL, MAX_VISIBLE_CANDLES };

export function CandleIntervalSelector({
  resolution,
  interval,
  onChange,
}: {
  resolution: string;
  interval: string;
  onChange: (interval: string) => void;
}) {
  const available = INTERVALS_BY_RESOLUTION[resolution];

  if (!available || available.size === 0) return null;

  return (
    <div className="flex flex-col gap-px rounded-md bg-background/80 px-1.5 py-1 backdrop-blur-sm">
      {INTERVAL_GROUPS.map((group, gi) => {
        const visible = group.filter((item) => available.has(item.value));
        if (visible.length === 0) return null;

        return (
          <div key={gi} className="flex items-center justify-around gap-1">
            {visible.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium leading-none transition-colors ${
                  interval === item.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
