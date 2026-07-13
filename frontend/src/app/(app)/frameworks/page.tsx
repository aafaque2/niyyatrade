"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFrameworks, useFrameworkPrefs } from "@/lib/hooks/use-frameworks";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  activateFramework,
  updateFrameworkPrefs,
} from "@/lib/services/identity";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { FrameworkCard } from "@/components/frameworks/framework-card";
import { ThresholdSlider } from "@/components/frameworks/threshold-slider";
import { ImpactPreview } from "@/components/frameworks/impact-preview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import type { Framework } from "@/lib/services/identity";

const FRAMEWORK_ORDER = ["standard", "esg", "aaoifi"];

function getThresholdRules(framework?: Framework) {
  const rules = framework?.defaultRules?.rules ?? {};
  const thresholdRules: { ruleId: string; name: string; description: string; threshold: number }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    const s = spec as unknown as Record<string, unknown>;
    if (s.type === "percentage" && typeof s.threshold === "number") {
      thresholdRules.push({
        ruleId,
        name: (s.name as string) ?? ruleId,
        description: (s.description as string) ?? "",
        threshold: s.threshold,
      });
    }
  }
  return thresholdRules;
}

function getSectorRules(framework?: Framework) {
  const rules = framework?.defaultRules?.rules ?? {};
  const sectorRules: { ruleId: string; name: string; bannedSectors: string[] }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    const s = spec as unknown as Record<string, unknown>;
    if ((s.type === "sector" || s.type === "esg_sector") && Array.isArray(s.bannedSectors)) {
      sectorRules.push({
        ruleId,
        name: (s.name as string) ?? ruleId,
        bannedSectors: s.bannedSectors as string[],
      });
    }
  }
  return sectorRules;
}

function getInsufficientDataRules(framework?: Framework) {
  const rules = framework?.defaultRules?.rules ?? {};
  const pending: { ruleId: string; name: string; description: string }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    const s = spec as unknown as Record<string, unknown>;
    if (s.type === "esg_insufficient_data") {
      pending.push({
        ruleId,
        name: (s.name as string) ?? ruleId,
        description: (s.description as string) ?? "",
      });
    }
  }
  return pending;
}

export default function FrameworksPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { data: frameworks, isLoading, isError, refetch } = useFrameworks();
  const { data: prefs } = useFrameworkPrefs();
  const { data: portfolio } = usePortfolio(false);

  const sortedFrameworks = useMemo(() => {
    if (!frameworks) return [];
    const sorted = [...frameworks].sort((a, b) => {
      const ia = FRAMEWORK_ORDER.indexOf(a.slug);
      const ib = FRAMEWORK_ORDER.indexOf(b.slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return sorted;
  }, [frameworks]);

  const frameworkList = useMemo(
    () =>
      sortedFrameworks.map((f) => ({
        id: f.id,
        slug: f.slug,
        name: f.name,
      })),
    [sortedFrameworks],
  );

  const activeId = user?.activeFrameworkId;
  const activeFramework = useMemo(
    () => frameworks?.find((f) => f.id === activeId),
    [frameworks, activeId],
  );

  const thresholdRules = useMemo(() => getThresholdRules(activeFramework), [activeFramework]);
  const sectorRules = useMemo(() => getSectorRules(activeFramework), [activeFramework]);
  const pendingRules = useMemo(() => getInsufficientDataRules(activeFramework), [activeFramework]);
  const isStandard = activeFramework?.slug === "standard";

  const defaultValues = useMemo(() => {
    const vals: Record<string, number> = {};
    for (const r of thresholdRules) {
      vals[r.ruleId] = r.threshold;
    }
    return vals;
  }, [thresholdRules]);

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const autoActivated = useRef(false);

  useEffect(() => {
    if (
      sortedFrameworks.length > 0 &&
      !user?.activeFrameworkId &&
      !autoActivated.current
    ) {
      const esg = sortedFrameworks.find((f) => f.slug === "esg");
      if (esg) {
        autoActivated.current = true;
        activateMutation.mutate(esg.id);
      }
    }
  }, [sortedFrameworks, user?.activeFrameworkId]);

  useEffect(() => {
    if (activeId && prefs) {
      const pref = prefs.find((p) => p.frameworkId === activeId);
      if (pref?.customThresholds) {
        setOverrides(pref.customThresholds as Record<string, number>);
        return;
      }
    }
    setOverrides({});
  }, [activeId, prefs]);

  const currentValues = useMemo(() => {
    const vals = { ...defaultValues };
    for (const [key, val] of Object.entries(overrides)) {
      if (key in vals) vals[key] = val;
    }
    return vals;
  }, [defaultValues, overrides]);

  const isDirty = thresholdRules.some((r) => currentValues[r.ruleId] !== defaultValues[r.ruleId]);

  const activateMutation = useMutation({
    mutationFn: activateFramework,
    onSuccess: (updatedUser) => {
      setUser({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        activeFrameworkId: updatedUser.activeFrameworkId,
      });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["framework-prefs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to activate framework");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error("No framework selected");
      const changed: Record<string, number> = {};
      for (const r of thresholdRules) {
        if (currentValues[r.ruleId] !== defaultValues[r.ruleId]) {
          changed[r.ruleId] = currentValues[r.ruleId];
        }
      }
      await updateFrameworkPrefs(activeId, changed);
    },
    onSuccess: () => {
      toast.success("Framework preferences updated");
      queryClient.invalidateQueries({ queryKey: ["framework-prefs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save preferences");
    },
  });

  const handleReset = () => setOverrides({});

  const handleSelect = (id: string) => {
    if (id !== activeId) {
      activateMutation.mutate(id);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Frameworks</h1>
          <p className="text-sm text-muted-foreground">
            Configure your compliance frameworks and thresholds.
          </p>
        </div>
        <ErrorState
          title="Failed to load frameworks"
          message="There was an error loading the available frameworks."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const compliantCount =
    portfolio?.positions?.filter((p) => p.complianceVerdict === "COMPLIANT").length ?? 0;
  const totalPositions = portfolio?.positions?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Frameworks</h1>
        <p className="text-sm text-muted-foreground">
          Configure your compliance frameworks and thresholds.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Active Framework
        </h2>
        {isLoading || activateMutation.isPending ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {frameworkList.map((f) => (
              <FrameworkCard
                key={f.id}
                framework={f}
                isActive={f.id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </section>

      {activeFramework && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Framework Rules
          </h2>
          <div className="rounded-lg border bg-surface p-4 space-y-6">
            {isStandard && (
              <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                The Standard framework applies no compliance filters. All stocks show as compliant.
                This is for educational purposes only — not investment advice.
              </div>
            )}

            {sectorRules.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Industry Screens</h3>
                {sectorRules.map((r) => (
                  <div key={r.ruleId} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{r.name}:</span>{" "}
                    Excludes companies in{" "}
                    {r.bannedSectors.map((s) => (
                      <Badge key={s} variant="outline" className="mx-0.5 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {thresholdRules.map((r) => {
              const val = currentValues[r.ruleId] ?? r.threshold;
              return (
                <ThresholdSlider
                  key={r.ruleId}
                  label={r.name}
                  description={r.description}
                  value={val}
                  defaultValue={r.threshold}
                  onChange={(v) => setOverrides((prev) => ({ ...prev, [r.ruleId]: v }))}
                />
              );
            })}

            {pendingRules.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Pending Data</h3>
                {pendingRules.map((r) => (
                  <div key={r.ruleId} className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="mt-0.5 text-muted-foreground">{r.description}</p>
                    <p className="mt-1 text-warning">
                      Data integration in progress — currently showing as compliant.
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(thresholdRules.length > 0 || sectorRules.length > 0 || pendingRules.length > 0) && (
              <ImpactPreview
                isDirty={isDirty}
                totalPositions={totalPositions}
                compliantCount={compliantCount}
              />
            )}

            {thresholdRules.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !isDirty}
                  size="sm"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={!isDirty}
                  variant="outline"
                  size="sm"
                >
                  Reset to Defaults
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
