"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "./command-palette";

export function TopNav() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <header className="fixed left-60 right-0 top-0 z-30 flex h-14 items-center border-b border-border bg-background px-6">
        <div className="flex w-full items-center justify-between">
          <div className="relative w-80">
            <kbd className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
            <Input
              placeholder="Search assets..."
              className="pl-12 text-sm"
              readOnly
              onFocus={() => setOpen(true)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Viewing:{" "}
              <span className="font-medium text-foreground">
                Halal Framework
              </span>
            </span>
          </div>
        </div>
      </header>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
