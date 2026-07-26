"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { RuleResult } from "@/lib/services/compliance";

export function RuleAccordion({ rules }: { rules: RuleResult[] }) {
  return (
    <Accordion className="w-full">
      {rules.map((rule) => (
        <AccordionItem key={rule.ruleId} value={rule.ruleId}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-2">
              <span className="text-xs font-medium">{rule.name}</span>
              <div className="flex items-center gap-1.5">
                {!rule.dataAvailable && (
                  <AlertCircle className="h-3 w-3 text-warning" />
                )}
                <Badge
                  variant={
                    rule.passed ? "default" : "destructive"
                  }
                  className={
                    rule.passed
                      ? rule.dataAvailable
                        ? "bg-emerald-subtle text-emerald-light border-emerald/20 text-[10px]"
                        : "border-warning/30 bg-warning/10 text-warning text-[10px]"
                      : "text-[10px]"
                  }
                >
                  {rule.passed
                    ? rule.dataAvailable
                      ? "Pass"
                      : "Pending"
                    : "Fail"}
                </Badge>
              </div>
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
