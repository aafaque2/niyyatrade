"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [hydrated, setHydrated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    useAuthStore.getState().hydrate();
    // Mount-once hydration sync — intentionally sets state in effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't flash wrong state before hydration
  const isAuthenticated = hydrated && !!token;

  return (
    <header
      className={
        scrolled
          ? "sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors"
          : "sticky top-0 z-40 w-full border-b border-transparent bg-transparent transition-colors"
      }
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="NiyyaTrade" width={32} height={32} className="h-8 w-auto" />
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
