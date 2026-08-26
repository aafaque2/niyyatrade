"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { searchAssets, type SearchResult } from "@/lib/services/market-data";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, WifiOff } from "lucide-react";

type SortField = "ticker" | "name" | "sector";
type SortDir = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" />
  );
}

const SECTORS = [
  "All Sectors",
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Industrials",
  "Energy",
  "Utilities",
  "Real Estate",
  "Basic Materials",
  "Communication Services",
  "Consumer Defensive",
];

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ["market-search", debouncedQuery || "all"],
    queryFn: () => searchAssets(debouncedQuery || "a"),
    staleTime: 30_000,
    retry: 1,
  });

  const filteredResults = useMemo(() => {
    if (!results) return [];
    let items = [...results];

    if (selectedSector !== "All Sectors") {
      items = items.filter(
        (r) => r.sector?.toLowerCase() === selectedSector.toLowerCase(),
      );
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "ticker") cmp = a.ticker.localeCompare(b.ticker);
      else if (sortField === "name") cmp = (a.name ?? "").localeCompare(b.name ?? "");
      else if (sortField === "sector") cmp = (a.sector ?? "").localeCompare(b.sector ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [results, selectedSector, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Markets</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Browse and search available equities.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm bg-surface border-border"
          />
        </div>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
        >
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("ticker")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Ticker <SortIcon field="ticker" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left hidden sm:table-cell">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Company <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">
                    <button
                      type="button"
                      onClick={() => handleSort("sector")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Sector <SortIcon field="sector" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Exchange
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <MarketRow key={result.ticker} result={result} />
                ))}
                {isError && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      <WifiOff className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      Couldn&apos;t load markets. Check your connection and try again.
                    </td>
                  </tr>
                )}
                {!isError && filteredResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No assets found. Try a different search term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && filteredResults.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredResults.length} asset{filteredResults.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function MarketRow({ result }: { result: SearchResult }) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-surface-hover/50 last:border-b-0">
      <td className="px-4 py-2.5">
        <Link
          href={`/assets/${result.ticker}`}
          className="text-xs font-semibold font-mono text-primary hover:underline"
        >
          {result.ticker}
        </Link>
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">
        {result.name}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
        {result.sector || "--"}
      </td>
      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
        {result.exchange || "--"}
      </td>
    </tr>
  );
}
