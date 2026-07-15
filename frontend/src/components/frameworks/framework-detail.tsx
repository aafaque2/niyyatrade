"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThresholdSlider } from "@/components/frameworks/threshold-slider";
import { ImpactPreview } from "@/components/frameworks/impact-preview";
import { activateFramework, updateFrameworkPrefs } from "@/lib/services/identity";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import type { Framework, RuleSpec } from "@/lib/services/identity";

interface FrameworkDetailProps {
  framework: Framework;
  activeId: string | null | undefined;
  prefs: { frameworkId: string; customThresholds: Record<string, number> }[] | undefined;
}

const FRAMEWORK_INFO: Record<string, { description: string; learnMore: string }> = {
  standard: {
    description:
      "The Standard framework applies no compliance filters or restrictions. All assets are automatically considered compliant. It serves as a baseline for comparison and educational purposes.",
    learnMore:
      "The Standard Framework is designed as a neutral baseline. It applies zero compliance rules, meaning every asset in your portfolio will always show as compliant. This is useful for:\n\n\u2022 Comparing how other frameworks affect your portfolio\n\u2022 Educational purposes to understand compliance concepts\n\u2022 Monitoring portfolio performance without any screening restrictions\n\nNo customisation options are available for this framework as it has no configurable rules.",
  },
  esg: {
    description:
      "The ESG (Environmental, Social, and Governance) framework screens companies on sustainability and ethical criteria. It evaluates carbon emissions, ethical business conduct, weapons involvement, employee satisfaction, and exposure to harmful industries.",
    learnMore:
      "The ESG Framework evaluates investments across five key dimensions:\n\n\u2022 Carbon Emissions: Excludes companies in high-carbon sectors such as Energy, Utilities, and Basic Materials.\n\u2022 Ethical Conduct: Screens for harassment, exploitation, and unethical labor practices.\n\u2022 Weapons & Defense: Excludes companies involved in weapons manufacturing.\n\u2022 Employee Satisfaction: Evaluates labor practices and workplace conditions.\n\u2022 Tobacco & Alcohol: Excludes companies in the Consumer Defensive sector.\n\nESG screening is particularly relevant for investors who want their portfolio to reflect sustainability values.",
  },
  "halal-aaoifi": {
    description:
      "The AAOIFI Halal Standard provides Shariah-compliance screening. It evaluates investments based on business sector permissibility and financial health ratios, ensuring alignment with Islamic principles.",
    learnMore:
      "The AAOIFI Halal Standard follows the Shariah screening methodology:\n\n\u2022 Sector Screen: The core business must not be in an impermissible industry. Banned sectors include Conventional Financials, Alcohol, Gambling, Adult Entertainment, Tobacco, and Defense.\n\u2022 Debt-to-Equity: Total debt cannot exceed the specified threshold of the trailing 12-month average market capitalisation.\n\u2022 Interest Income: Interest income must be below the specified threshold of total revenue.\n\nYou can customise the financial ratio thresholds to match your preferred level of screening strictness.",
  },
};

function getThresholdRules(rules: Record<string, RuleSpec>) {
  const result: { ruleId: string; name: string; description: string; threshold: number }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    if (spec.type === "percentage" && typeof spec.threshold === "number") {
      result.push({
        ruleId,
        name: ruleId,
        description: spec.description ?? "",
        threshold: spec.threshold,
      });
    }
  }
  return result;
}

function getSectorRules(rules: Record<string, RuleSpec>) {
  const result: { ruleId: string; name: string; bannedSectors: string[] }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    if ((spec.type === "sector" || spec.type === "esg_sector") && Array.isArray(spec.bannedSectors)) {
      result.push({
        ruleId,
        name: ruleId === "sector_screen" ? "Sector Screening" : ruleId,
        bannedSectors: spec.bannedSectors as string[],
      });
    }
  }
  return result;
}

function getInsufficientDataRules(rules: Record<string, RuleSpec>) {
  const result: { ruleId: string; name: string; description: string }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    if (spec.type === "esg_insufficient_data") {
      result.push({
        ruleId,
        name: ruleId,
        description: spec.description ?? "",
      });
    }
  }
  return result;
}

function RuleCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-md border border-border bg-surface/50 p-3 cursor-pointer hover:bg-surface transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );
}

export function FrameworkDetail({
  framework,
  activeId,
  prefs,
}: FrameworkDetailProps) {
  const isActive = framework.id === activeId;
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const rules = framework.defaultRules?.rules ?? {};
  const thresholdRules = useMemo(() => getThresholdRules(rules), [rules]);
  const sectorRules = useMemo(() => getSectorRules(rules), [rules]);
  const isStandard = framework.slug === "standard";

  const activePref = prefs?.find((p) => p.frameworkId === framework.id);
  const defaultValues = useMemo(() => {
    const vals: Record<string, number> = {};
    for (const r of thresholdRules) {
      vals[r.ruleId] = r.threshold;
    }
    return vals;
  }, [thresholdRules]);

  const defaultEnabledRules = useMemo(() => Object.keys(rules), [rules]);

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [enabledRules, setEnabledRules] = useState<Set<string>>(new Set(defaultEnabledRules));

  useEffect(() => {
    setEnabledRules(new Set(defaultEnabledRules));
  }, [defaultEnabledRules]);

  useEffect(() => {
    if (activePref?.customThresholds) {
      setOverrides(activePref.customThresholds);
    } else {
      setOverrides({});
    }
  }, [activePref?.customThresholds]);

  const currentValues = useMemo(() => {
    const vals = { ...defaultValues };
    for (const [key, val] of Object.entries(overrides)) {
      if (key in vals) vals[key] = val;
    }
    return vals;
  }, [defaultValues, overrides]);

  const thresholdsDirty = thresholdRules.some((r) => currentValues[r.ruleId] !== defaultValues[r.ruleId]);
  const esgDirty =
    framework.slug === "esg" &&
    (defaultEnabledRules.some((id) => !enabledRules.has(id)) ||
      enabledRules.size !== defaultEnabledRules.length);
  const isDirty = thresholdsDirty || esgDirty;

  const compliantCount =
    portfolio?.positions?.filter((p) => p.complianceVerdict === "COMPLIANT").length ?? 0;
  const totalPositions = portfolio?.positions?.length ?? 0;

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
      toast.success(`${framework.name} is now your active framework`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to activate framework");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateFrameworkPrefs(framework.id, overrides);
    },
    onSuccess: () => {
      toast.success("Framework preferences updated");
      queryClient.invalidateQueries({ queryKey: ["framework-prefs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save preferences");
    },
  });

  const handleActivate = () => {
    activateMutation.mutate(framework.id);
  };

  const info = FRAMEWORK_INFO[framework.slug];
  const isActivating = activateMutation.isPending;

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">{framework.name}</h2>
          {isActive && (
            <Badge variant="default" className="bg-emerald/15 text-emerald-light border-emerald/20 text-[10px]">
              Active
            </Badge>
          )}
        </div>
        {info && (
          <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        )}
      </div>

      {/* Learn More toggle */}
      {info && (
        <div>
          <button
            type="button"
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            {showLearnMore ? "Show less" : "Learn more about this framework"}
          </button>
          {showLearnMore && (
            <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {info.learnMore}
            </div>
          )}
        </div>
      )}

      {/* Standard warning */}
      {isStandard && (
        <div className="rounded-md border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
          The Standard framework applies no compliance filters. All stocks show as compliant.
          This is for educational purposes only — not investment advice.
        </div>
      )}

      {/* ESG specific: rule checkboxes */}
      {framework.slug === "esg" && Object.keys(rules).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Screening Criteria</h3>
          <p className="text-xs text-muted-foreground">
            The following ESG criteria are evaluated for every position. Toggle individual criteria on or off to customise your screening.
          </p>
          {Object.entries(rules).map(([ruleId, spec]) => {
            const isSector = spec.type === "esg_sector";
            const isInsufficientData = spec.type === "esg_insufficient_data";
            return (
              <div key={ruleId} className="space-y-1">
                <RuleCheckbox
                  id={ruleId}
                  label={spec.name ?? ruleId}
                  description={spec.description ?? ""}
                  checked={enabledRules.has(ruleId)}
                  onChange={(checked) => {
                    setEnabledRules((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(ruleId);
                      else next.delete(ruleId);
                      return next;
                    });
                  }}
                />
                {isSector && enabledRules.has(ruleId) && spec.bannedSectors && spec.bannedSectors.length > 0 && (
                  <div className="ml-7 text-xs text-muted-foreground">
                    Excludes{" "}
                    {spec.bannedSectors.map((s) => (
                      <Badge key={s} variant="outline" className="mx-0.5 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                {isInsufficientData && enabledRules.has(ruleId) && (
                  <div className="ml-7 text-xs text-warning">
                    Data integration in progress — currently showing as compliant.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AAOIFI: sector rules */}
      {framework.slug === "halal-aaoifi" && sectorRules.length > 0 && (
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

      {/* AAOIFI: threshold sliders */}
      {framework.slug === "halal-aaoifi" && thresholdRules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Financial Thresholds</h3>
          {thresholdRules.map((r) => {
            const val = currentValues[r.ruleId] ?? r.threshold;
            return (
              <ThresholdSlider
                key={r.ruleId}
                label={r.name === "debt_to_equity" ? "Max Debt-to-Market Cap" : r.name === "interest_income" ? "Max Interest Income" : r.name}
                description={r.description}
                value={val}
                defaultValue={r.threshold}
                onChange={(v) => setOverrides((prev) => ({ ...prev, [r.ruleId]: v }))}
              />
            );
          })}
        </div>
      )}

      {/* Impact preview */}
      {framework.slug === "halal-aaoifi" && thresholdRules.length > 0 && (
        <ImpactPreview
          isDirty={isDirty}
          totalPositions={totalPositions}
          compliantCount={compliantCount}
        />
      )}

      {/* Activate button when not the active framework */}
      {!isActive && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            size="sm"
            className="bg-primary hover:bg-emerald-muted"
          >
            {isActivating ? "Activating..." : "Activate Framework"}
          </Button>
        </div>
      )}

      {/* Save controls when active */}
      {isActive && isDirty && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="sm"
            className="bg-primary hover:bg-emerald-muted"
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={() => {
              setOverrides({});
              if (framework.slug === "esg") {
                setEnabledRules(new Set(defaultEnabledRules));
              }
              updateFrameworkPrefs(framework.id, {});
              queryClient.invalidateQueries({ queryKey: ["framework-prefs"] });
              toast.success("Preferences reset to defaults");
            }}
            disabled={saveMutation.isPending}
            variant="outline"
            size="sm"
          >
            Reset to Defaults
          </Button>
        </div>
      )}
    </div>
  );
}
