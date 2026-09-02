"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [hydrated, setHydrated] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    useAuthStore.getState().hydrate();
    setHydrated(true);
  }, []);

  // Don't flash wrong state before hydration
  const isAuthenticated = hydrated && !!token;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="NiyyaTrade" className="h-8 w-auto" />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">NiyyaTrade</span>
        </Link>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/portfolio"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
            >
              Go to Portfolio
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
