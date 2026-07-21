"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFrameworks, useFrameworkPrefs } from "@/lib/hooks/use-frameworks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { activateFramework } from "@/lib/services/identity";
import { FrameworkCard } from "@/components/frameworks/framework-card";
import { FrameworkDetail } from "@/components/frameworks/framework-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Shield, Plus, Sparkles } from "lucide-react";

const FRAMEWORK_ORDER = ["standard", "esg", "halal-aaoifi"];

export default function FrameworksPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { data: frameworks, isLoading, isError, refetch } = useFrameworks();
  const { data: prefs } = useFrameworkPrefs();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const hasSyncedRef = useRef(false);
  const autoActivated = useRef(false);

  const sortedFrameworks = useMemo(() => {
    if (!frameworks) return [];
    return [...frameworks].sort((a, b) => {
      const ia = FRAMEWORK_ORDER.indexOf(a.slug);
      const ib = FRAMEWORK_ORDER.indexOf(b.slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
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
  const selectedFramework = useMemo(
    () => sortedFrameworks.find((f) => f.id === selectedFrameworkId),
    [sortedFrameworks, selectedFrameworkId],
  );

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

  useEffect(() => {
    if (sortedFrameworks.length === 0) return;

    if (!user?.activeFrameworkId && !autoActivated.current) {
      const esg = sortedFrameworks.find((f) => f.slug === "esg");
      if (esg) {
        autoActivated.current = true;
        activateMutation.mutate(esg.id);
      }
    }
  }, [sortedFrameworks, user?.activeFrameworkId]);

  useEffect(() => {
    if (activeId && sortedFrameworks.length > 0 && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      setSelectedFrameworkId(activeId);
    }
  }, [activeId, sortedFrameworks]);

  const handleSelect = (id: string) => {
    setSelectedFrameworkId((prev) => (prev === id ? null : id));
  };

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
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Compliance Center</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure, customise, and understand your compliance frameworks.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Available Frameworks
        </h2>
        {isLoading || activateMutation.isPending ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {frameworkList.map((f) => (
              <FrameworkCard
                key={f.id}
                framework={f}
                isActive={f.id === activeId}
                isSelected={f.id === selectedFrameworkId}
                onSelect={handleSelect}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                toast.info("Custom frameworks coming soon — build your own compliance rules.")
              }
              className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface/30 p-4 text-center transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 cursor-pointer min-h-[80px]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface transition-colors group-hover:bg-primary/10">
                <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  Create Custom
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center justify-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Coming soon
                </p>
              </div>
            </button>
          </div>
        )}
      </section>

      {selectedFramework ? (
        <section>
          <h2 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Framework Details
          </h2>
          <FrameworkDetail
            key={selectedFramework.id}
            framework={selectedFramework}
            activeId={activeId}
            prefs={prefs}
          />
        </section>
      ) : (
        <section>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Select a framework above to view its details and customise its rules.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
