"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import dynamic from "next/dynamic";
import { useComplianceFrameworkStore } from "@/lib/stores/compliance-framework-store";
import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { useFrameworks } from "@/lib/hooks/use-frameworks";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuleAccordion } from "@/components/compliance/rule-accordion";
import { cn } from "@/lib/utils";

const FRAMEWORK_LABELS: Record<string, string> = {
  esg: "Ethical (ESG)",
  "halal-aaoifi": "Halal (AAOIFI)",
};

function FrameworkTab({
  slug,
  ticker,
  isActive,
  onClick,
}: {
  slug: string;
  ticker: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const { data: frameworks } = useFrameworks();
  const { data, isLoading } = useComplianceReport(ticker, slug);

  const label =
    FRAMEWORK_LABELS[slug] ??
    frameworks?.find((f) => f.slug === slug)?.name ??
    slug;

  const isCompliant = data?.verdict === "COMPLIANT";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all w-full",
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground/70",
      )}
    >
      {label}
      {isLoading && (
        <Skeleton className="h-4 w-12 rounded-full" />
      )}
      {data && (
        <Badge
          variant={isCompliant ? "default" : "destructive"}
          className={cn(
            "text-[10px] px-1.5 py-0",
            isCompliant
              ? "bg-emerald-subtle text-emerald-light border-emerald/20"
              : "bg-red-500/10 text-red-400 border-red-500/20",
          )}
        >
          {isCompliant ? "Compliant" : "Non-Compliant"}
        </Badge>
      )}
    </button>
  );
}

function FrameworkPanel({ slug, ticker }: { slug: string; ticker: string }) {
  const { data: frameworks } = useFrameworks();
  const { data, isLoading, isError } = useComplianceReport(ticker, slug);

  const label =
    FRAMEWORK_LABELS[slug] ??
    frameworks?.find((f) => f.slug === slug)?.name ??
    slug;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Compliance data unavailable for {label}. This may be due to market hours or data source limitations.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4">
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
    </div>
  );
}

export function ComplianceSection({ ticker }: { ticker: string }) {
  const selectedFrameworks = useComplianceFrameworkStore((s) => s.selectedFrameworks);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  if (selectedFrameworks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Compliance
        </p>
        <div className="rounded-md bg-surface p-4 text-center">
          <p className="text-sm font-medium">Standard Mode</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No compliance frameworks active. All assets are treated as compliant.
            Enable a framework in Compliance Center to apply screening rules.
          </p>
        </div>
      </div>
    );
  }

  const expanded = activeSlug ?? selectedFrameworks[0];

  return (
    <div className="rounded-lg border border-border bg-surface/50">
      <div className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${selectedFrameworks.length}, minmax(0, 1fr))` }}>
        {selectedFrameworks.map((slug) => (
          <FrameworkTab
            key={slug}
            slug={slug}
            ticker={ticker}
            isActive={slug === expanded}
            onClick={() => setActiveSlug(slug)}
          />
        ))}
      </div>
      <FrameworkPanel slug={expanded} ticker={ticker} />
    </div>
  );
}
