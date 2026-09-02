"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "./command-palette";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useComplianceFrameworkStore } from "@/lib/stores/compliance-framework-store";
import { useFrameworks } from "@/lib/hooks/use-frameworks";
import { Bell, LogOut, Settings, User, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const FRAMEWORK_LABELS: Record<string, string> = {
  esg: "Ethical",
  "halal-aaoifi": "Halal",
};

export function TopNav() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hydrated);
  const logout = useAuthStore((s) => s.logout);
  const { data: frameworks } = useFrameworks();
  const selectedFrameworks = useComplianceFrameworkStore((s) => s.selectedFrameworks);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isGuest = hydrated && !token;

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const searchHandler = () => setOpen(true);
    document.addEventListener("keydown", keyHandler);
    window.addEventListener("opencode-search", searchHandler);
    return () => {
      document.removeEventListener("keydown", keyHandler);
      window.removeEventListener("opencode-search", searchHandler);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const getFrameworkLabel = (slug: string) => {
    if (FRAMEWORK_LABELS[slug]) return FRAMEWORK_LABELS[slug];
    const fw = frameworks?.find((f) => f.slug === slug);
    return fw?.name ?? slug;
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur-md pl-14 pr-6 lg:left-[232px] lg:pl-6">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="relative w-full max-w-80 flex-1 lg:flex-none">
            <kbd className="absolute left-3 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
            <Input
              placeholder="Search assets..."
              aria-label="Search assets"
              className="h-8 pl-11 text-sm bg-surface border-border"
              readOnly
              onFocus={() => setOpen(true)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Framework Badges */}
            <div className="flex items-center gap-1.5">
              {selectedFrameworks.length === 0 ? (
                <span className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Standard
                </span>
              ) : (
                selectedFrameworks.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {getFrameworkLabel(slug)}
                  </span>
                ))
              )}
              <button
                type="button"
                onClick={() => router.push("/frameworks")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Manage frameworks"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* User Menu / Guest CTA */}
            {isGuest ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="hidden sm:inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground hover:bg-emerald-muted"
                >
                  Create account
                </button>
              </div>
            ) : (
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                    {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden text-xs font-medium md:inline">
                    {user?.name ?? user?.email?.split("@")[0] ?? "User"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg animate-fade-in">
                    <div className="px-2.5 py-2 border-b border-border mb-1">
                      <p className="text-xs font-medium text-foreground truncate">{user?.name ?? "User"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/settings");
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        router.push("/login");
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
