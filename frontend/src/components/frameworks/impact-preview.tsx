"use client";

interface ImpactPreviewProps {
  isDirty: boolean;
  totalPositions: number;
  compliantCount: number;
}

export function ImpactPreview({
  isDirty,
  totalPositions,
  compliantCount,
}: ImpactPreviewProps) {
  if (!isDirty) return null;

  const nonCompliant = totalPositions - compliantCount;

  return (
    <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-xs text-muted-foreground">
      With these thresholds,{" "}
      <span className="font-medium text-foreground">{compliantCount}</span> of{" "}
      <span className="font-medium text-foreground">{totalPositions}</span>{" "}
      portfolio holdings would remain compliant.
      {nonCompliant > 0 && (
        <span className="text-warning">
          {" "}
          {nonCompliant} holding{nonCompliant > 1 ? "s" : ""} would{" "}
          {nonCompliant > 1 ? "fail" : "fails"} compliance.
        </span>
      )}
    </div>
  );
}
