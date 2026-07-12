"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, CandlestickData, Time } from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCandles } from "@/lib/hooks/use-candles";

export function AssetChart({ ticker }: { ticker: string }) {
  const { data: candles, isLoading, isError } = useCandles(ticker, "1M");

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !candles?.length) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border text-sm text-muted-foreground">
        Chart data unavailable
      </div>
    );
  }

  return <ChartInner candles={candles} />;
}

function ChartInner({ candles }: { candles: [number, number, number, number, number, number][] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#27272a",
      },
      rightPriceScale: {
        borderColor: "#27272a",
      },
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

    const chartData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c[0] as Time,
      open: c[1] / 100,
      high: c[2] / 100,
      low: c[3] / 100,
      close: c[4] / 100,
    }));

    series.setData(chartData);

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  return <div ref={containerRef} className="w-full" />;
}
