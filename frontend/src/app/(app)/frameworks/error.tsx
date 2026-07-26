"use client";

export default function FrameworksError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-4xl font-mono font-bold text-destructive/20">!</p>
        <h1 className="text-lg font-semibold tracking-tight">Frameworks unavailable</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Failed to load compliance frameworks. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
