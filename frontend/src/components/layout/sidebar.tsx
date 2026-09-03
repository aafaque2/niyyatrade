"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Briefcase,
  Bookmark,
  Shield,
  History,
  Settings,
  Menu,
  X,
  Search,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

const navItems = [
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Markets", href: "/markets", icon: TrendingUp },
  { label: "Watchlists", href: "/watchlist", icon: Bookmark },
  { label: "Compliance", href: "/frameworks", icon: Shield },
  { label: "History", href: "/history", icon: History },
];

const bottomItems = [
  { label: "Settings", href: "/settings", icon: Settings },
];

const PROTECTED_HREFS = new Set(["/portfolio", "/watchlist", "/history", "/settings"]);

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const isGuest = hydrated && !token;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-md bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-[232px] flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-out",
          "max-lg:data-[open=false]:-translate-x-full",
        )}
        data-open={open}
      >
        <div className="flex h-14 items-center justify-end border-b border-border px-5 lg:justify-start">
          <Link
            href="/portfolio"
            className="flex flex-end items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="NiyyaTrade"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("opencode-search"));
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search assets...</span>
            <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/portfolio" && pathname === "/");
            const isProtected = PROTECTED_HREFS.has(item.href);
            const locked = isGuest && isProtected;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground/50" />}
              </Link>
            );
          })}
          {isGuest && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Guest mode</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Sign in to access your portfolio, watchlists & trading.
              </p>
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex h-7 items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-medium hover:bg-surface-hover"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex h-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-emerald-muted"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="mt-auto border-t border-border px-3 py-3 space-y-0.5">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="flex items-center gap-3 px-2.5 pt-2 text-[10px] text-muted-foreground/60">
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
