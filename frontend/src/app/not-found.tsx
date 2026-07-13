import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-mono font-bold text-muted-foreground/30">
          404
        </p>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/portfolio"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Portfolio
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border px-4 text-xs font-medium text-foreground hover:bg-surface-hover"
          >
            Search Assets
          </Link>
        </div>
      </div>
    </div>
  );
}
