"use client";

import Link from "next/link";
import type { ComplianceHistoryItem } from "@/lib/services/history";
import { EmptyState } from "@/components/ui/empty-state";
import { Shield, CheckCircle, XCircle } from "lucide-react";

interface ComplianceTableProps {
  items: ComplianceHistoryItem[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ComplianceTable({ items }: ComplianceTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No compliance history yet"
        description="Compliance evaluations will appear here as you view assets."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Asset</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Verdict</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-surface-hover/50">
              <td className="px-4 py-2.5">
                <Link
                  href={`/assets/${item.ticker}`}
                  className="font-semibold font-mono text-xs text-primary hover:underline"
                >
                  {item.ticker}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    item.verdict === "COMPLIANT"
                      ? "bg-emerald-subtle text-emerald-light border-emerald/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {item.verdict === "COMPLIANT" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {item.verdict === "COMPLIANT" ? "Compliant" : "Non-Compliant"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                {formatDate(item.evaluatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
