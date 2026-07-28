"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFrameworks, useFrameworkPrefs } from "@/lib/hooks/use-frameworks";
import { useComplianceFrameworkStore } from "@/lib/stores/compliance-framework-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { activateFramework, deactivateFramework } from "@/lib/services/identity";
import { FrameworkDetail } from "@/components/frameworks/framework-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  ShieldCheck,
  Leaf,
  Moon,
  Flag,
  ChevronRight,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FRAMEWORK_ORDER = ["esg", "halal-aaoifi", "bds"];

const FRAMEWORK_META: Record<
  string,
  { description: string; icon: typeof Leaf; color: string; colorValue: string; activeRing: string; activeBg: string }
> = {
  esg: {
    description: "Environmental, Social & Governance screening",
    icon: Leaf,
    color: "text-emerald-400",
    colorValue: "#22c55e",
    activeRing: "ring-emerald-500/30",
    activeBg: "bg-emerald-500/5",
  },
  "halal-aaoifi": {
    description: "AAOIFI Shariah compliance screening",
    icon: Moon,
    color: "text-blue-400",
    colorValue: "#60a5fa",
    activeRing: "ring-blue-500/30",
    activeBg: "bg-blue-500/5",
  },
  bds: {
    description: "BDS Palestinian solidarity divestment screening",
    icon: Flag,
    color: "text-red-400",
    colorValue: "#f87171",
    activeRing: "ring-red-500/30",
    activeBg: "bg-red-500/5",
  },
};

const FALLBACK_META = {
  description: "Compliance screening framework.",
  icon: ShieldCheck,
  color: "text-muted-foreground",
  colorValue: "#94a3b8",
  activeRing: "ring-border",
  activeBg: "bg-surface",
};

export default function FrameworksPage() {
  const { data: frameworks, isLoading, isError, refetch } = useFrameworks();
  const { data: prefs } = useFrameworkPrefs();
  const selectedFrameworks = useComplianceFrameworkStore((s) => s.selectedFrameworks);
  const toggleFramework = useComplianceFrameworkStore((s) => s.toggleFramework);
  const queryClient = useQueryClient();
  const [viewingSlug, setViewingSlug] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const syncHalalMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        const halal = frameworks?.find((f) => f.slug === "halal-aaoifi");
        if (!halal) throw new Error("Halal framework not found");
        return activateFramework(halal.id);
      }
      return deactivateFramework();
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to sync framework enforcement");
    },
  });

  const sortedFrameworks = useMemo(() => {
    if (!frameworks) return [];
    return [...frameworks]
      .filter((f) => f.slug !== "standard")
      .sort((a, b) => {
        const ia = FRAMEWORK_ORDER.indexOf(a.slug);
        const ib = FRAMEWORK_ORDER.indexOf(b.slug);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }, [frameworks]);

  const viewingData = useMemo(
    () => sortedFrameworks.find((f) => f.slug === viewingSlug),
    [sortedFrameworks, viewingSlug],
  );

  useEffect(() => {
    if (initializedRef.current || sortedFrameworks.length === 0) return;
    const firstEnabled = sortedFrameworks.find((f) => selectedFrameworks.includes(f.slug));
    if (firstEnabled) {
      setViewingSlug(firstEnabled.slug);
    }
    initializedRef.current = true;
  }, [sortedFrameworks, selectedFrameworks]);

  const syncedRef = useRef(false);
  useEffect(() => {
    if (syncedRef.current || !frameworks || syncHalalMutation.isPending) return;
    const halalEnabled = selectedFrameworks.includes("halal-aaoifi");
    const user = useAuthStore.getState().user;
    const halalFramework = frameworks.find((f) => f.slug === "halal-aaoifi");
    if (!halalFramework) return;
    const serverHasHalal = user?.activeFrameworkId === halalFramework.id;

    if (halalEnabled && !serverHasHalal) {
      syncHalalMutation.mutate(true);
      syncedRef.current = true;
    } else if (!halalEnabled && serverHasHalal) {
      syncHalalMutation.mutate(false);
      syncedRef.current = true;
    }
  }, [frameworks, selectedFrameworks, syncHalalMutation]);

  if (isError) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance Center</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Compliance Center</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
            Choose frameworks to screen your portfolio. Each applies its own rules to evaluate your holdings.
          </p>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: Framework list + How it works */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFrameworks.map((f) => {
                const isEnabled = selectedFrameworks.includes(f.slug);
                const meta = FRAMEWORK_META[f.slug] ?? FALLBACK_META;
                const Icon = meta.icon;
                const isViewing = viewingSlug === f.slug;

                return (
                  <div key={f.id} className="relative">
                    <div
                      className={cn(
                        "rounded-xl border p-4 transition-all duration-200 cursor-pointer",
                        isViewing
                          ? cn("border-primary/30 ring-1", meta.activeRing, meta.activeBg)
                          : "border-border bg-surface/30 hover:border-border hover:bg-surface/50",
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setViewingSlug(isViewing ? null : f.slug); }}
                      onClick={() => setViewingSlug(isViewing ? null : f.slug)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isEnabled ? "bg-primary/15" : "bg-surface",
                          )}
                        >
                          <Icon className={cn("h-4.5 w-4.5", isEnabled ? meta.color : "text-muted-foreground")} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold leading-tight">{f.name}</h3>
                            {isEnabled && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {meta.description}
                          </p>
                        </div>

                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFramework(f.slug);
                            if (f.slug === "halal-aaoifi") {
                              syncHalalMutation.mutate(!isEnabled);
                            }
                          }}
                          className={cn(
                            "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 cursor-pointer",
                            isEnabled ? "bg-primary" : "bg-border",
                          )}
                          aria-label={`${isEnabled ? "Disable" : "Enable"} ${f.name}`}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                              isEnabled && "translate-x-4",
                            )}
                          />
                        </button>
                      </div>

                      {/* View rules link */}
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">
                        <BookOpen className="h-3 w-3" />
                        {isViewing ? "Viewing rules" : "View rules"}
                        <ChevronRight className={cn("h-3 w-3 transition-transform", isViewing && "rotate-90")} />
                      </div>
                    </div>

                    {/* Connector arrow pointing to detail panel */}
                    {isViewing && (
                      <div className="absolute right-[-13px] top-1/2 -translate-y-1/2 hidden lg:block">
                        <div
                          className="w-0 h-0"
                          style={{
                            borderTop: "6px solid transparent",
                            borderBottom: "6px solid transparent",
                            borderLeft: `8px solid ${meta.colorValue}`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Create Custom */}
              <button
                type="button"
                onClick={() =>
                  toast.info("Custom frameworks coming soon — build your own compliance rules.")
                }
                className="group flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-surface/20 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 cursor-pointer w-full"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border group-hover:border-primary/30 transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Create Custom
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    Coming soon
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* How it works — below the list */}
          <div className="rounded-xl border border-border bg-surface/30 p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              How it works
            </h2>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  1
                </span>
                <p>
                  <span className="font-medium text-foreground">Toggle frameworks</span>{" "}
                  on or off to activate screening rules.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  2
                </span>
                <p>
                  <span className="font-medium text-foreground">Review rules</span>{" "}
                  and customise thresholds for each framework.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  3
                </span>
                <p>
                  <span className="font-medium text-foreground">See results</span>{" "}
                  reflected across your portfolio and asset pages.
                </p>
              </div>
            </div>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:underline"
            >
              View portfolio <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right: Detail panel */}
        <div>
          {viewingData ? (
            <div
              className="rounded-xl border border-border bg-surface/30 p-5 transition-all duration-200"
              style={{ borderLeftWidth: "3px", borderLeftColor: FRAMEWORK_META[viewingData.slug]?.colorValue ?? "#94a3b8" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                {(() => {
                  const meta = FRAMEWORK_META[viewingData.slug] ?? FALLBACK_META;
                  const Icon = meta.icon;
                  return (
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15")}>
                      <Icon className={cn("h-4 w-4", meta.color)} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-sm font-semibold">{viewingData.name}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {FRAMEWORK_META[viewingData.slug]?.description ?? "Compliance rules"}
                  </p>
                </div>
              </div>
              <FrameworkDetail
                key={viewingData.id}
                framework={viewingData}
                activeId={null}
                prefs={prefs}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface/20">
              <div className="text-center px-6">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                  <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Select a framework to view its rules
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Click &quot;View rules&quot; on any framework from the list.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
