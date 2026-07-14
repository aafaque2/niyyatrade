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
      className={`w-full rounded-lg border p-4 text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : isActive
            ? "border-success/40 bg-success/5 ring-1 ring-success/30"
            : "border-border bg-surface hover:border-primary/50 hover:bg-surface-hover"
      } ${isComingSoon ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{framework.name}</span>
        <div className="flex items-center gap-1.5">
          {isSelected && !isActive && (
            <span className="text-[10px] text-primary">Selected</span>
          )}
          {isActive && (
            <Badge variant="default" className="text-[10px]">
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
