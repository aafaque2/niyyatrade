"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchAssets } from "@/lib/services/market-data";
import { searchKeys } from "@/lib/query-keys";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/use-debounce";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClose(); }}
        role="button"
        tabIndex={-1}
        aria-label="Close"
      />
      <div className="fixed left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 rounded-lg border border-border bg-background shadow-2xl">
        <CommandPaletteInner onClose={onClose} />
      </div>
    </div>
  );
}

function CommandPaletteInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 500);

  const { data: results } = useQuery({
    queryKey: searchKeys.query(debouncedQuery),
    queryFn: () => searchAssets(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigateTo = useCallback(
    (ticker: string) => {
      router.push(`/assets/${ticker}`);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const count = results?.length ?? 0;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, count - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results && results.length > 0) {
      e.preventDefault();
      const idx = Math.min(selectedIndex, results.length - 1);
      navigateTo(results[idx].ticker);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const resultsList = results ?? [];

  return (
    <>
      <div className="p-3">
        <Input
          ref={inputRef}
          placeholder="Search assets by name or ticker..."
          aria-label="Search assets"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="h-10 text-sm bg-surface border-border"
        />
      </div>
      {resultsList.length > 0 && (
        <div className="max-h-72 overflow-y-auto border-t border-border p-1">
          {resultsList.map((result, index) => (
            <button
              key={result.ticker}
              onClick={() => navigateTo(result.ticker)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-surface-hover text-foreground"
                  : "text-foreground"
              }`}
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {result.ticker}
              </span>
              <span className="truncate text-muted-foreground text-xs">
                {result.name}
              </span>
              {result.exchange && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {result.exchange}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {debouncedQuery && resultsList.length === 0 && (
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          No assets found for &quot;{debouncedQuery}&quot;
        </p>
      )}
      <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </>
  );
}
