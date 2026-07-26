"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { useFrameworks } from "@/lib/hooks/use-frameworks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuleAccordion } from "./rule-accordion";
import { FrameworkSelector } from "@/components/asset/framework-selector";

export function ComplianceCard({ ticker }: { ticker: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: frameworks } = useFrameworks();

  const defaultSlug = useMemo(() => {
    if (!user?.activeFrameworkId || !frameworks) return undefined;
    return frameworks.find((fw) => fw.id === user.activeFrameworkId)?.slug;
  }, [user, frameworks]);

  const [frameworkId, setFrameworkId] = useState<string | undefined>(defaultSlug);
  const { data, isLoading, isError, error } = useComplianceReport(ticker, frameworkId);

  const framework = frameworkId ?? defaultSlug ?? "esg";
  const isStandard = framework === "standard";

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">
          Framework Evaluation
        </h2>
      </div>

      <FrameworkSelector
        selected={framework}
        onSelect={setFrameworkId}
      />

      {isStandard && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/20 bg-warning/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="text-xs text-warning">
            <p className="font-medium">For educational purposes only</p>
            <p className="mt-0.5 text-muted-foreground">
              The Standard framework applies no compliance filters. All stocks
              show as compliant. This view is for experimental and educational
              use only — it does not represent investment advice or
              recommendations.
            </p>
          </div>
        </div>
      )}

      {isLoading && <Skeleton className="mt-3 h-24 w-full rounded-lg" />}

      {isError && (
        <p className="mt-3 text-xs text-destructive">
          {error?.message ?? "Failed to load compliance data"}
        </p>
      )}

      {data && (
        <>
          <div className="mt-3 mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Verdict</span>
            <Badge
              variant={
                data.verdict === "COMPLIANT" ? "default" : "destructive"
              }
              className={
                data.verdict === "COMPLIANT"
                  ? "bg-emerald-subtle text-emerald-light border-emerald/20"
                  : ""
              }
            >
              {data.verdict === "COMPLIANT" ? "Compliant" : "Non-Compliant"}
            </Badge>
          </div>

          {data.dataCoverage.withoutData > 0 && (
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
