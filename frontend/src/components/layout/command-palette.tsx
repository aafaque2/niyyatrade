"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchAssets } from "@/lib/services/market-data";
import { searchKeys } from "@/lib/query-keys";
import { Input } from "@/components/ui/input";
import { ExchangeBadge } from "@/components/market/exchange-badge";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Loader2 } from "lucide-react";

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
        aria-hidden="true"
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

  const isDebouncing = query !== debouncedQuery;
  const { data: results, isFetching } = useQuery({
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
      <div className="relative p-3">
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
          className="h-10 pr-10 text-sm bg-surface border-border"
          aria-busy={isFetching || isDebouncing}
        />
        {(isFetching || isDebouncing) && query.length > 0 && (
          <Loader2 className="pointer-events-none absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {isFetching && debouncedQuery && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
        </div>
      )}
      {resultsList.length > 0 && (
        <div className="max-h-72 overflow-y-auto border-t border-border p-1" role="listbox" aria-label="Search results">
          {resultsList.map((result, index) => (
            <button
              key={result.ticker}
              role="option"
              aria-selected={index === selectedIndex}
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
              <div className="ml-auto flex items-center gap-1.5">
                {result.currency && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {result.currency}
                  </span>
                )}
                <ExchangeBadge exchange={result.exchange} />
              </div>
            </button>
          ))}
        </div>
      )}
      {!isFetching && !isDebouncing && debouncedQuery && resultsList.length === 0 && (
        <p className="px-4 pb-3 text-xs text-muted-foreground" role="status" aria-live="polite">
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
