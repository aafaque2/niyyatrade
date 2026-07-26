"use client";

import { Info } from "lucide-react";
import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { useFrameworks } from "@/lib/hooks/use-frameworks";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuleAccordion } from "./rule-accordion";
import { cn } from "@/lib/utils";

const FRAMEWORK_LABELS: Record<string, string> = {
  esg: "Ethical (ESG)",
  "halal-aaoifi": "Halal (AAOIFI)",
};

export function ComplianceCard({
  ticker,
  frameworkSlug,
}: {
  ticker: string;
  frameworkSlug: string;
}) {
  const { data: frameworks } = useFrameworks();
  const { data, isLoading, isError } = useComplianceReport(ticker, frameworkSlug);

  const label =
    FRAMEWORK_LABELS[frameworkSlug] ??
    frameworks?.find((f) => f.slug === frameworkSlug)?.name ??
    frameworkSlug;

  const isCompliant = data?.verdict === "COMPLIANT";

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface/50 p-4 transition-colors",
        !data || isLoading
          ? "border-border"
          : isCompliant
            ? "border-emerald/30 bg-emerald/[0.03]"
            : "border-red-500/30 bg-red-500/[0.03]",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
        {data && (
          <Badge
            variant={isCompliant ? "default" : "destructive"}
            className={
              isCompliant
                ? "bg-emerald-subtle text-emerald-light border-emerald/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }
          >
            {isCompliant ? "Compliant" : "Non-Compliant"}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Compliance data unavailable for this asset. This may be due to market hours or data source limitations.
          </p>
        </div>
      )}

      {data && (
        <>
          {data.dataCoverage && data.dataCoverage.withoutData > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-warning/20 bg-warning/5 px-3 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <p className="text-[11px] leading-relaxed text-warning">
                {data.dataCoverage.withoutData} of {data.dataCoverage.total} rules
                evaluated with incomplete data ({data.dataCoverage.percentage}% coverage).
                Results marked &quot;Pending&quot; require additional data sources.
              </p>
            </div>
          )}

          <RuleAccordion rules={data.rules} />
        </>
      )}
    </div>
  );
}
