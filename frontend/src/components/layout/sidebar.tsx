"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Bell,
  Bookmark,
  Scale,
  History,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Search", href: null, icon: Search, cmdK: true, action: "open-search" as const },
  { label: "Portfolio", href: "/portfolio", icon: LayoutDashboard },
  { label: "Watchlist", href: "/watchlist", icon: Bookmark },
  { label: "Frameworks", href: "/frameworks", icon: Scale },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-6">
        <Link href="/portfolio" className="text-lg font-semibold tracking-tight">
          HalalTrade
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.action === "open-search") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("opencode-search"))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <kbd className="ml-auto rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="text-xs">No notifications</span>
        </div>
      </div>
    </aside>
  );
}
