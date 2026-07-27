"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Briefcase,
  Shield,
  Activity,
} from "lucide-react";
import { usePositionVerdict } from "./position-compliance-badge";

interface AnimatedValueProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

function AnimatedValue({ value, format = formatCents, className }: AnimatedValueProps) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayed(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <span className={className}>{format(displayed)}</span>;
}

interface DashboardSummaryProps {
  totalValueCents?: number;
  buyingPowerCents?: number;
  overallComplianceScore?: number;
  dailyChangePercent?: number;
  baseCurrency?: string;
  isLoading?: boolean;
}

export function DashboardSummary({
  totalValueCents,
  buyingPowerCents,
  overallComplianceScore,
  dailyChangePercent,
  baseCurrency = "USD",
  isLoading,
}: DashboardSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface/50 p-4 space-y-2.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const positive = (dailyChangePercent ?? 0) >= 0;
  const complianceColor =
    (overallComplianceScore ?? 0) >= 80
      ? "text-emerald-light"
      : (overallComplianceScore ?? 0) >= 50
        ? "text-warning"
        : "text-danger";

  const cards = [
    {
      label: "Portfolio Value",
      value: totalValueCents ?? 0,
      icon: Briefcase,
      iconColor: "text-primary",
      format: (v: number) => formatCents(v, baseCurrency),
      change: dailyChangePercent != null ? { value: dailyChangePercent, positive } : null,
    },
    {
      label: "Cash Available",
      value: buyingPowerCents ?? 0,
      icon: Banknote,
      iconColor: "text-emerald-light",
      format: (v: number) => formatCents(v, baseCurrency),
    },
    {
      label: "Daily Change",
      value: dailyChangePercent ?? 0,
      icon: positive ? TrendingUp : TrendingDown,
      iconColor: positive ? "text-emerald-light" : "text-danger",
      format: (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
    },
    {
      label: "Compliance Score",
      value: overallComplianceScore ?? 0,
      icon: Shield,
      iconColor: complianceColor,
      format: (v: number) => `${Math.round(v)}%`,
      className: complianceColor,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group rounded-lg border border-border bg-surface/50 p-4 transition-colors hover:bg-surface"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <Icon className={cn("h-4 w-4", card.iconColor)} />
            </div>
            <div className="mt-2">
              <AnimatedValue
                value={card.value}
                format={card.format}
                className={cn(
                  "text-2xl font-semibold font-mono tracking-tight text-foreground",
                  card.className,
                )}
              />
            </div>
            {card.change && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  card.change.positive ? "text-emerald-light" : "text-danger",
                )}
              >
                {card.change.positive ? "+" : ""}
                {card.change.value.toFixed(2)}% today
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TickerScoreItem({
  ticker,
  frameworkSlugs,
  onVerdict,
}: {
  ticker: string;
  frameworkSlugs: string[];
  onVerdict: (ticker: string, verdict: string) => void;
}) {
  const verdict = usePositionVerdict(ticker, frameworkSlugs);
  // Report verdict up via effect to avoid stale closures
  useEffect(() => {
    onVerdict(ticker, verdict);
  }, [ticker, verdict, onVerdict]);
  return null;
}

interface PortfolioSummaryProps {
  tickers: string[];
  frameworkSlugs: string[];
  totalValueCents?: number;
  buyingPowerCents?: number;
  dailyChangePercent?: number;
  baseCurrency?: string;
  isLoading?: boolean;
}

export function PortfolioSummary({
  tickers,
  frameworkSlugs,
  totalValueCents,
  buyingPowerCents,
  dailyChangePercent,
  baseCurrency,
  isLoading,
}: PortfolioSummaryProps) {
  const [verdictMap, setVerdictMap] = useState<Record<string, string>>({});

  const handleVerdict = (ticker: string, verdict: string) => {
    setVerdictMap((prev) => {
      if (prev[ticker] === verdict) return prev;
      return { ...prev, [ticker]: verdict };
    });
  };

  const total = tickers.length;
  const compliantCount = Object.values(verdictMap).filter((v) => v === "COMPLIANT").length;
  const score = total > 0 ? Math.round((compliantCount / total) * 100) : 100;

  return (
    <>
      {frameworkSlugs.length > 0 &&
        tickers.map((ticker) => (
          <TickerScoreItem
            key={ticker}
            ticker={ticker}
            frameworkSlugs={frameworkSlugs}
            onVerdict={handleVerdict}
          />
        ))}
      <DashboardSummary
        totalValueCents={totalValueCents}
        buyingPowerCents={buyingPowerCents}
        overallComplianceScore={score}
        dailyChangePercent={dailyChangePercent}
        baseCurrency={baseCurrency}
        isLoading={isLoading}
      />
    </>
  );
}
