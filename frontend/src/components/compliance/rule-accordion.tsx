"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { RuleResult } from "@/lib/services/compliance";

export function RuleAccordion({ rules }: { rules: RuleResult[] }) {
  return (
    <Accordion className="w-full">
      {rules.map((rule) => (
        <AccordionItem key={rule.ruleId} value={rule.ruleId}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-2">
              <span className="text-xs font-medium">{rule.name}</span>
              <Badge
                variant={
                  rule.passed ? "default" : "destructive"
                }
                className={
                  rule.passed
                    ? "bg-emerald-subtle text-emerald-light border-emerald/20 text-[10px]"
                    : "text-[10px]"
                }
              >
                {rule.passed ? "Pass" : "Fail"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Actual:</span>
                <span className="font-mono font-medium text-foreground">
                  {rule.actualValue}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Threshold:</span>
                <span className="font-mono font-medium text-foreground">
                  {rule.thresholdValue}
                </span>
              </div>
              {rule.explanation && (
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                  {rule.explanation}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
