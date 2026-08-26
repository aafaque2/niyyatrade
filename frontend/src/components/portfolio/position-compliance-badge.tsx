"use client";

import { useQueries } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { evaluateCompliance } from "@/lib/services/compliance";
import { complianceKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

function SingleFrameworkBadge({ ticker, frameworkSlug }: { ticker: string; frameworkSlug: string }) {
  const { data, isLoading } = useComplianceReport(ticker, frameworkSlug);

  if (isLoading) return <Skeleton className="h-4 w-14 rounded-full" />;
  if (!data) return null;

  const isCompliant = data.verdict === "COMPLIANT";
  return (
    <Badge
      variant={isCompliant ? "default" : "destructive"}
      className={`text-[10px] ${
        isCompliant
          ? "bg-emerald-subtle text-emerald-light border-emerald/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      {isCompliant ? "Compliant" : "Non-Compliant"}
    </Badge>
  );
}

export function PositionComplianceBadge({
  ticker,
  frameworkSlugs,
}: {
  ticker: string;
  frameworkSlugs: string[];
}) {
  if (frameworkSlugs.length === 0) {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        —
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {frameworkSlugs.map((slug) => (
        <SingleFrameworkBadge key={slug} ticker={ticker} frameworkSlug={slug} />
      ))}
    </div>
  );
}

export function usePositionVerdict(ticker: string, frameworkSlugs: string[]) {
  const user = useAuthStore((s) => s.user);

  const reports = useQueries({
    queries: frameworkSlugs.map((slug) => ({
      queryKey: complianceKeys.evaluate(ticker, slug, user?.id),
      queryFn: () => evaluateCompliance(ticker, slug),
      enabled: ticker.length > 0,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const isLoading = reports.some((r) => r.isLoading);
  const verdicts = reports.map((r) => r.data?.verdict).filter(Boolean);

  if (isLoading && verdicts.length === 0) return "LOADING" as const;
  if (verdicts.length === 0) return "UNKNOWN" as const;
  if (verdicts.every((v) => v === "COMPLIANT")) return "COMPLIANT" as const;
  return "NON_COMPLIANT" as const;
}
