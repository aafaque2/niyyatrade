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
  isComingSoon?: boolean;
  onSelect: (id: string) => void;
}

export function FrameworkCard({
  framework,
  isActive,
  isComingSoon,
  onSelect,
}: FrameworkCardProps) {
  return (
    <button
      type="button"
      disabled={isComingSoon}
      onClick={() => onSelect(framework.id)}
      className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "bg-surface hover:bg-surface-hover"
      } ${isComingSoon ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{framework.name}</span>
        {isActive && (
          <Badge variant="default" className="text-[10px]">
            Active
          </Badge>
        )}
        {isComingSoon && (
          <span className="text-[10px] text-muted-foreground">Coming soon</span>
        )}
      </div>
      {isComingSoon && (
        <p className="mt-1 text-xs text-muted-foreground">
          ESG-based compliance evaluation
        </p>
      )}
    </button>
  );
}
