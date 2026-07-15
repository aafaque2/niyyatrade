"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FRAMEWORKS = [
  { id: "esg", name: "ESG", description: "Environmental, Social & Governance" },
  { id: "halal-aaoifi", name: "AAOIFI", description: "Islamic finance screening" },
  { id: "standard", name: "Standard", description: "No compliance filters — for education only" },
] as const;

export function FrameworkSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {FRAMEWORKS.map((fw) => {
        const isActive = selected === fw.id;
        return (
          <button
            key={fw.id}
            type="button"
            onClick={() => onSelect(fw.id)}
            className={cn(
              "relative flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left transition-all duration-150",
              isActive
                ? "border-primary/30 bg-primary/10"
                : "border-border hover:bg-surface-hover bg-surface/50",
            )}
          >
            <div className="flex-1">
              <div className="text-xs font-medium">{fw.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {fw.description}
              </div>
            </div>
            {isActive && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
