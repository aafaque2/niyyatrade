"use client";

import { Badge } from "@/components/ui/badge";

export interface FrameworkCardData {
  id: string;
  slug: string;
  name: string;
}

interface FrameworkCardProps {
  framework: FrameworkCardData;
  isActive: boolean;
  isSelected: boolean;
  isComingSoon?: boolean;
  onSelect: (id: string) => void;
}

export function FrameworkCard({
  framework,
  isActive,
  isSelected,
  isComingSoon,
  onSelect,
}: FrameworkCardProps) {
  return (
    <button
      type="button"
      disabled={isComingSoon}
      onClick={() => onSelect(framework.id)}
      className={`w-full rounded-lg border p-4 text-center transition-all duration-150 ${
        isSelected
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : isActive
            ? "border-emerald/30 bg-emerald-subtle ring-1 ring-emerald/10"
            : "border-border bg-surface/50 hover:border-border hover:bg-surface"
      } ${isComingSoon ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-medium leading-snug">{framework.name}</span>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <Badge variant="default" className="bg-emerald/15 text-emerald-light border-emerald/20 text-[10px]">
              Active
            </Badge>
          )}
          {isComingSoon && (
            <span className="text-[10px] text-muted-foreground">Coming soon</span>
          )}
        </div>
      </div>
      {isComingSoon && (
        <p className="mt-1 text-xs text-muted-foreground">
          ESG-based compliance evaluation
        </p>
      )}
    </button>
  );
}
