"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  LogicalRange,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCandles } from "@/lib/hooks/use-candles";
import { useMarketStatus, useLiveQuote } from "@/app/(app)/assets/[ticker]/client";
import { getCandles } from "@/lib/services/market-data";
import { cn } from "@/lib/utils";
import {
  CandleIntervalSelector,
  DEFAULT_INTERVAL,
  MAX_VISIBLE_CANDLES,
} from "@/components/charts/candle-interval-selector";

type Candle = [number, number, number, number, number, number];

const TIMEFRAMES = [
  { label: "1D", resolution: "1D" },
  { label: "1W", resolution: "1W" },
  { label: "1M", resolution: "1M" },
  { label: "1Y", resolution: "1Y" },
  { label: "ALL", resolution: "ALL" },
] as const;

const LOOKBACK_SECONDS: Record<string, number> = {
  "1D": 86400,
  "1W": 7 * 86400,
  "1M": 30 * 86400,
  "1Y": 365 * 86400,
  ALL: 10 * 365 * 86400,
};

export function AssetChart({ ticker }: { ticker: string }) {
  const [resolution, setResolution] = useState("1M");
  const [interval, setInterval] = useState(DEFAULT_INTERVAL["1M"]);
  const marketStatus = useMarketStatus();

  const handleResolutionChange = (r: string) => {
    setResolution(r);
    setInterval(DEFAULT_INTERVAL[r] ?? "1d");
  };

  const { data: initialCandles, isLoading, isError } = useCandles(ticker, resolution, { marketStatus, interval });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !initialCandles?.length) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground">Chart data unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Historical data may be delayed or unavailable for this market
        </p>
      </div>
    );
  }

  return (
    <div>
      <ChartInner ticker={ticker} resolution={resolution} interval={interval} initialCandles={initialCandles} onIntervalChange={setInterval} />
      <div className="mt-3 flex items-center gap-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.resolution}
            type="button"
            onClick={() => handleResolutionChange(tf.resolution)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
              resolution === tf.resolution
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartInner({
  ticker,
  resolution,
  interval,
  initialCandles,
  onIntervalChange,
}: {
  ticker: string;
  resolution: string;
  interval: string;
  initialCandles: Candle[];
  onIntervalChange: (interval: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const allDataRef = useRef<Map<number, Candle>>(new Map());
  const loadingMoreRef = useRef(false);
  const reachedStartRef = useRef(false);
  const scrollHandlerRef = useRef<((range: LogicalRange | null) => void) | null>(null);
  const mountedRef = useRef(true);
  const keyRef = useRef<string>("");
  const rangeSetupRef = useRef(false);

  const liveQuote = useLiveQuote();

  const toChartData = useCallback(
    (c: Candle): CandlestickData<Time> => ({
      time: c[0] as Time,
      open: c[1] / 100,
      high: c[2] / 100,
      low: c[3] / 100,
      close: c[4] / 100,
    }),
    [],
  );

  const loadMoreHistory = useCallback(
    async (beforeTimestamp: number) => {
      if (loadingMoreRef.current || reachedStartRef.current) return;
      loadingMoreRef.current = true;
      try {
        const chart = chartRef.current;
        const series = seriesRef.current;
        if (!chart || !series) return;

        // Capture the leftmost visible time so the viewport stays anchored
        // on the same candle after older candles are prepended. Without this,
        // restoring the raw logical range (which had from < 5) snaps the view
        // to the start on every fetch; trackpad momentum then cascades until
        // the earliest bar (IPO) is loaded.
        const prevRange = chart.timeScale().getVisibleLogicalRange();
        const sortedBefore = Array.from(allDataRef.current.values()).sort(
          (a, b) => a[0] - b[0],
        );
        const leftIdx = prevRange
          ? Math.max(0, Math.min(sortedBefore.length - 1, Math.floor(prevRange.from)))
          : Math.max(0, sortedBefore.length - 1);
        const leftTime = sortedBefore[leftIdx]?.[0] as number | undefined;
        const width = prevRange ? prevRange.to - prevRange.from : (MAX_VISIBLE_CANDLES[interval] ?? 150);

        const lookback = LOOKBACK_SECONDS[resolution] ?? 30 * 86400;
        const from = beforeTimestamp - lookback;
        const moreCandles = await getCandles(ticker, resolution, {
          from,
          to: beforeTimestamp - 1,
          interval,
        });
        if (!mountedRef.current) return;

        if (moreCandles.length === 0) {
          reachedStartRef.current = true;
          return;
        }

        let hasNew = false;
        for (const c of moreCandles) {
          if (!allDataRef.current.has(c[0])) {
            allDataRef.current.set(c[0], c);
            hasNew = true;
          }
        }

        if (hasNew) {
          const sorted = Array.from(allDataRef.current.values()).sort(
            (a, b) => a[0] - b[0],
          );
          series.setData(sorted.map(toChartData));

          // Keep the same candle at the left edge after prepend — prevents
          // the "scroll a little left → auto-scrolls to IPO" cascade.
          if (leftTime != null) {
            const newIdx = sorted.findIndex((c) => c[0] === leftTime);
            if (newIdx >= 0) {
              const targetFrom = newIdx;
              const targetTo = newIdx + width;
              chart.timeScale().setVisibleLogicalRange({
                from: Math.max(0, targetFrom),
                to: targetTo,
              });
            }
          }
        } else {
          // Backend returned only duplicates for this window — treat as
          // having reached the start if the returned window was large enough
          // that further fetches would just repeat.
          reachedStartRef.current = true;
        }
      } catch {
        // silently fail — we'll retry on next scroll
      } finally {
        loadingMoreRef.current = false;
      }
    },
    [ticker, resolution, interval, toChartData],
  );

  // Create chart once
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    mountedRef.current = true;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94A3B8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1E293B" },
        horzLines: { color: "#1E293B" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: { mode: 0 },
      timeScale: {
        borderColor: "#232B35",
        rightOffsetPixels: 20,
      },
      rightPriceScale: { borderColor: "#232B35" },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mountedRef.current = false;
      if (scrollHandlerRef.current) {
        chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      keyRef.current = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial data load — ONLY runs when ticker, resolution, or interval changes
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const newKey = `${ticker}:${resolution}:${interval}`;
    const isFirstLoad = keyRef.current === "";
    const keyChanged = keyRef.current !== newKey;
    keyRef.current = newKey;

    if (isFirstLoad || keyChanged) {
      reachedStartRef.current = false;
      allDataRef.current.clear();
      const sorted = [...initialCandles].sort((a, b) => a[0] - b[0]);
      for (const c of sorted) {
        allDataRef.current.set(c[0], c);
      }
      series.setData(sorted.map(toChartData));

      if (scrollHandlerRef.current) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(scrollHandlerRef.current);
      }

      rangeSetupRef.current = true;

      const count = sorted.length;
      const maxVisible = MAX_VISIBLE_CANDLES[interval] ?? 150;
      const visibleCount = Math.min(count, maxVisible);
      chart.timeScale().setVisibleLogicalRange({
        from: count - visibleCount,
        to: count,
      });

      const handler = (range: LogicalRange | null) => {
        if (!range || loadingMoreRef.current || reachedStartRef.current) return;
        if (rangeSetupRef.current) {
          rangeSetupRef.current = false;
          return;
        }
        if (range.from < 5) {
          const timestamps = Array.from(allDataRef.current.keys()).sort(
            (a, b) => a - b,
          );
          if (timestamps.length > 0) {
            loadMoreHistory(timestamps[0]);
          }
        }
      };
      scrollHandlerRef.current = handler;
      chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    }

    return () => {
      if (scrollHandlerRef.current) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, resolution, interval]);

  // Live update from candle data refetch — merges new candles, never clears existing
  useEffect(() => {
    if (!initialCandles?.length || !seriesRef.current) return;

    const sorted = [...initialCandles].sort((a, b) => a[0] - b[0]);
    const timestamps = Array.from(allDataRef.current.keys());
    const maxTs = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    const newCandles = sorted.filter((c) => c[0] > maxTs);
    if (newCandles.length === 0) return;

    for (const c of newCandles) {
      allDataRef.current.set(c[0], c);
      seriesRef.current.update(toChartData(c));
    }
  }, [initialCandles, toChartData]);

  // Live update from quote — ticks the last candle's close/high/low in real time
  useEffect(() => {
    if (!liveQuote?.priceCents || !seriesRef.current) return;

    const timestamps = Array.from(allDataRef.current.keys());
    if (timestamps.length === 0) return;

    const lastTs = Math.max(...timestamps);
    const lastCandle = allDataRef.current.get(lastTs);
    if (!lastCandle) return;

    const price = liveQuote.priceCents / 100;
    const newClose = Math.round(price * 100);
    const newHigh = Math.max(lastCandle[2], newClose);
    const newLow = Math.min(lastCandle[3], newClose);

    if (lastCandle[4] === newClose && lastCandle[2] === newHigh && lastCandle[3] === newLow) {
      return;
    }

    const updated: Candle = [lastCandle[0], lastCandle[1], newHigh, newLow, newClose, lastCandle[5]];
    allDataRef.current.set(lastTs, updated);
    seriesRef.current.update(toChartData(updated));
  }, [liveQuote, toChartData]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: 400 }}>
      <div className="pointer-events-none absolute left-2 top-2 z-10">
        <div className="pointer-events-auto">
          <CandleIntervalSelector
            resolution={resolution}
            interval={interval}
            onChange={onIntervalChange}
          />
        </div>
      </div>
    </div>
  );
}
