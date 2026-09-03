"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-mono font-bold text-destructive/20">500</p>
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
          >
            Try Again
          </button>
          <a
            href="/portfolio"
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
