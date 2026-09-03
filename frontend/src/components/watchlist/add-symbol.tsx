"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAssets } from "@/lib/services/market-data";
import { searchKeys } from "@/lib/query-keys";
import { useAddToWatchlist } from "@/lib/hooks/use-watchlist";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

interface AddSymbolProps {
  existingTickers: string[];
}

export function AddSymbol({ existingTickers }: AddSymbolProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const addMutation = useAddToWatchlist();

  const isDebouncing = query !== debounced;
  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: searchKeys.query(debounced),
    queryFn: () => searchAssets(debounced),
    enabled: debounced.length >= 1,
    staleTime: 60_000,
  });
  const searching = isLoading || isFetching || isDebouncing;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ticker: string) => {
    addMutation.mutate(ticker);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const filtered =
    results?.filter((r) => !existingTickers.includes(r.ticker)) ?? [];

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search and add symbols..."
          aria-label="Search symbols"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pr-8 bg-surface border-border"
          aria-busy={searching && query.length >= 1}
        />
        {searching && query.length >= 1 && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.length >= 1 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg" role="listbox" aria-label="Asset search results">
          {filtered.length === 0 && !searching && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground" role="status">
              No results found
            </p>
          )}

          {filtered.map((result) => (
            <button
              key={result.ticker}
              type="button"
              onClick={() => handleSelect(result.ticker)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-surface-hover"
            >
              <div>
                <span className="font-semibold font-mono text-primary">
                  {result.ticker}
                </span>
                <span className="ml-2 text-muted-foreground">
                  {result.name}
                </span>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
