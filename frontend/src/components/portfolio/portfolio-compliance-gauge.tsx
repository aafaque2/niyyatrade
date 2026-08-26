"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { ComplianceGauge } from "./compliance-gauge";
import { evaluateCompliance } from "@/lib/services/compliance";
import { complianceKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

interface PortfolioComplianceGaugeProps {
  tickers: string[];
  frameworkSlugs: string[];
}

function PositionVerdictFetcher({
  tickers,
  frameworkSlugs,
}: {
  tickers: string[];
  frameworkSlugs: string[];
}) {
  const user = useAuthStore((s) => s.user);

  const pairs = tickers.flatMap((ticker) =>
    frameworkSlugs.map((slug) => ({ ticker, slug }))
  );

  const results = useQueries({
    queries: pairs.map(({ ticker, slug }) => ({
      queryKey: complianceKeys.evaluate(ticker, slug, user?.id),
      queryFn: () => evaluateCompliance(ticker, slug),
      enabled: ticker.length > 0,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const verdicts = tickers.map((ticker, ti) => {
    const slice = results.slice(
      ti * frameworkSlugs.length,
      (ti + 1) * frameworkSlugs.length
    );
    const tickerVerdicts = slice
      .map((r) => r.data?.verdict)
      .filter(Boolean);
    if (slice.some((r) => r.isLoading) && tickerVerdicts.length === 0)
      return "LOADING" as const;
    if (tickerVerdicts.length === 0) return "UNKNOWN" as const;
    if (tickerVerdicts.every((v) => v === "COMPLIANT"))
      return "COMPLIANT" as const;
    return "NON_COMPLIANT" as const;
  });

  const total = verdicts.length;
  const loading = verdicts.some((v) => v === "LOADING");
  const compliantCount = verdicts.filter((v) => v === "COMPLIANT").length;
  const score = total > 0 ? Math.round((compliantCount / total) * 100) : 100;

  return (
    <ComplianceGauge
      score={score}
      totalPositions={total}
      compliantCount={compliantCount}
      frameworkLabel={
        frameworkSlugs.length === 1
          ? frameworkSlugs[0]
          : frameworkSlugs.length > 1
            ? `${frameworkSlugs.length} frameworks`
            : undefined
      }
      isLoading={loading}
    />
  );
}

export function PortfolioComplianceGauge({
  tickers,
  frameworkSlugs,
}: PortfolioComplianceGaugeProps) {
  if (frameworkSlugs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">Portfolio Compliance</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border">
            <ShieldOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No Framework Selected</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enable a compliance framework to evaluate your holdings.
            </p>
            <Link
              href="/frameworks"
              className="inline-block text-xs font-medium text-primary hover:underline mt-0.5"
            >
              Open Compliance Center →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PositionVerdictFetcher
      tickers={tickers}
      frameworkSlugs={frameworkSlugs}
    />
  );
}
