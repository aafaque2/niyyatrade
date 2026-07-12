"use client";

import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuleAccordion } from "./rule-accordion";

export function ComplianceCard({
  ticker,
}: {
  ticker: string;
}) {
  const { data, isLoading, isError, error } = useComplianceReport(ticker);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Compliance
        </h2>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Compliance
        </h2>
        <p className="text-xs text-destructive">
          {error?.message ?? "Failed to load compliance data"}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Compliance
        </h2>
        <Badge
          variant={
            data.verdict === "COMPLIANT" ? "default" : "destructive"
          }
        >
          {data.verdict === "COMPLIANT" ? "Halal" : "Not Halal"}
        </Badge>
      </div>

      <RuleAccordion rules={data.rules} />
    </div>
  );
}
