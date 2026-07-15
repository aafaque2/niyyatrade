import Link from "next/link";
import { TrendingUp } from "lucide-react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NiyyaTrade";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-sidebar/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{APP_NAME}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. Framework-driven investing.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
