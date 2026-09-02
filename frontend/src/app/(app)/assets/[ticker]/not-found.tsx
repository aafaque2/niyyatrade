import Link from "next/link";
import { SearchX } from "lucide-react";

export default function AssetNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Asset not found</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t find that ticker. Check the symbol (e.g., AAPL, RELIANCE, TCS) or browse the full market list.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/markets"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-emerald-muted"
          >
            Browse Markets
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-surface-hover"
          >
            Go to Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
