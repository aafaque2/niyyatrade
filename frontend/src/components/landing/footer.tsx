import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "HalalTrade";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
