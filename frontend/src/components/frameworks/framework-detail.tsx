"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThresholdSlider } from "@/components/frameworks/threshold-slider";
import { ImpactPreview } from "@/components/frameworks/impact-preview";
import { updateFrameworkPrefs } from "@/lib/services/identity";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
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
  bds: {
    description:
      "The BDS (Boycott, Divestment, Sanctions) framework screens investments against the Palestinian-led BDS movement's divestment shortlist. Companies identified as complicit in the Israeli occupation, apartheid, or settlements are flagged for divestment.",
    learnMore:
      "The BDS Divestment Framework is based on research by the American Friends Service Committee (AFSC) Investigate database and the BDS National Committee (BNC):\n\n\u2022 Companies are identified through the AFSC's rigorous methodology evaluating salience, culpability, and resistance.\n\u2022 The screening covers military-security suppliers, tech companies providing infrastructure for the occupation, settlement profiteers, and complicit consumer brands.\n\u2022 The ticker list is sourced from the BoyStk database (311+ publicly-traded companies) and the AFSC divestment shortlist.\n\u2022 This framework applies a simple rule: if a company is on the list, it is flagged as non-compliant.\n\nBDS screening is relevant for investors who want their portfolio to align with international law and human rights principles regarding the Israeli-Palestinian conflict.",
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

function getTickerListRules(rules: Record<string, RuleSpec>) {
  const result: { ruleId: string; name: string; description: string; bannedTickers: string[] }[] = [];
  for (const [ruleId, spec] of Object.entries(rules)) {
    if (spec.type === "ticker_list" && Array.isArray(spec.bannedTickers)) {
      result.push({
        ruleId,
        name: spec.name ?? ruleId,
        description: spec.description ?? "",
        bannedTickers: spec.bannedTickers as string[],
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
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [tickerSearch, setTickerSearch] = useState("");
  const [expandedTickerRules, setExpandedTickerRules] = useState<Set<string>>(new Set());
  const rules = framework.defaultRules?.rules ?? {};
  const thresholdRules = useMemo(() => getThresholdRules(rules), [rules]);
  const sectorRules = useMemo(() => getSectorRules(rules), [rules]);
  const tickerListRules = useMemo(() => getTickerListRules(rules), [rules]);
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
  const [excludedTickers, setExcludedTickers] = useState<Set<string>>(new Set());
  const [initialExcludedTickers, setInitialExcludedTickers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Reset local form state when the framework's server-side defaults change.
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnabledRules(new Set(defaultEnabledRules));

    if (activePref?.customThresholds) {
      const th = { ...activePref.customThresholds };
      const excluded = (th as Record<string, unknown>)["__excludedTickers"];
      if (Array.isArray(excluded)) {
        const s = new Set(excluded as string[]);
        setExcludedTickers(s);
        setInitialExcludedTickers(new Set(s));
        delete (th as Record<string, unknown>)["__excludedTickers"];
      } else {
        setExcludedTickers(new Set());
        setInitialExcludedTickers(new Set());
      }
      setOverrides(th as Record<string, number>);
    } else {
      setOverrides({});
      setExcludedTickers(new Set());
      setInitialExcludedTickers(new Set());
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activePref?.customThresholds, defaultEnabledRules]);

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
  const bdsDirty =
    framework.slug === "bds" &&
    (excludedTickers.size !== initialExcludedTickers.size ||
      [...excludedTickers].some((t) => !initialExcludedTickers.has(t)));
  const isDirty = thresholdsDirty || esgDirty || bdsDirty;

  const compliantCount =
    portfolio?.positions?.filter((p) => p.complianceVerdict === "COMPLIANT").length ?? 0;
  const totalPositions = portfolio?.positions?.length ?? 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...overrides };
      if (excludedTickers.size > 0) {
        payload["__excludedTickers"] = Array.from(excludedTickers);
      }
      await updateFrameworkPrefs(framework.id, payload);
    },
    onSuccess: () => {
      toast.success("Framework preferences updated");
      queryClient.invalidateQueries({ queryKey: ["framework-prefs"] });
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save preferences");
    },
  });

  const info = FRAMEWORK_INFO[framework.slug];

  return (
    <div className="space-y-4">
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

      {/* BDS: ticker list rules */}
      {framework.slug === "bds" && tickerListRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Divestment Shortlist</h3>
          <p className="text-xs text-muted-foreground">
            Companies identified by the BDS movement as complicit in the Israeli occupation. Toggle a rule to see the full list.
          </p>
          {tickerListRules.map((r) => {
            const isExpanded = expandedTickerRules.has(r.ruleId);
            const filtered = tickerSearch
              ? r.bannedTickers.filter((t) => t.toUpperCase().includes(tickerSearch.toUpperCase()))
              : r.bannedTickers;
            return (
              <div key={r.ruleId} className="rounded-md border border-border bg-surface/50">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTickerRules((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.ruleId)) next.delete(r.ruleId);
                      else next.add(r.ruleId);
                      return next;
                    });
                  }}
                  className="flex w-full items-center justify-between p-3 text-left cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.bannedTickers.length} flagged companies
                    </p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Search tickers..."
                      value={tickerSearch}
                      onChange={(e) => setTickerSearch(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        Showing {filtered.length} of {r.bannedTickers.length} companies
                      </p>
                      {excludedTickers.size > 0 && (
                        <p className="text-[10px] text-primary">
                          {excludedTickers.size} excluded
                        </p>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto scrollbar-green rounded-md border border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border">
                        {filtered.map((ticker) => {
                          const isExcluded = excludedTickers.has(ticker);
                          return (
                            <label
                              key={ticker}
                              className={cn(
                                "flex items-center gap-1.5 bg-surface px-2 py-1 cursor-pointer transition-colors hover:bg-surface-hover",
                                isExcluded && "opacity-50",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => {
                                  setExcludedTickers((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(ticker)) next.delete(ticker);
                                    else next.add(ticker);
                                    return next;
                                  });
                                }}
                                className="h-3 w-3 rounded border-border accent-primary"
                              />
                              <span className={cn("text-xs font-mono font-medium", isExcluded ? "text-muted-foreground line-through" : "text-foreground")}>
                                {ticker}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Save button */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          size="sm"
          className="bg-primary hover:bg-emerald-muted"
        >
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        {isDirty && (
          <Button
            onClick={() => {
              setOverrides({});
              setExcludedTickers(new Set(initialExcludedTickers));
              if (framework.slug === "esg") {
                setEnabledRules(new Set(defaultEnabledRules));
              }
            }}
            disabled={saveMutation.isPending}
            variant="outline"
            size="sm"
          >
            Discard
          </Button>
        )}
      </div>


    </div>
  );
}
