"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-mono font-bold text-destructive/30">500</p>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
          <a
            href="/portfolio"
            className="inline-flex h-9 items-center rounded-md border px-4 text-xs font-medium text-foreground hover:bg-surface-hover"
          >
            Go to Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
