"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { searchAssets, type SearchResult } from "@/lib/services/market-data";
import { getQuote } from "@/lib/services/market-data";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn, formatCents, formatPercent, formatCompactNumber } from "@/lib/utils";

type SortField = "ticker" | "name" | "marketCap" | "sector";
type SortDir = "asc" | "desc";

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

  const { data: results, isLoading } = useQuery({
    queryKey: ["market-search", debouncedQuery || "all"],
    queryFn: () => searchAssets(debouncedQuery || "a"),
    staleTime: 30_000,
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Markets</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Browse and search available equities.
        </p>
      </div>

      <div className="flex items-center gap-3">
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
                      Ticker <SortIcon field="ticker" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Company <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("sector")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Sector <SortIcon field="sector" />
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
                {filteredResults.length === 0 && (
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
  const { data: quote } = useQuery({
    queryKey: ["quote", result.ticker],
    queryFn: () => getQuote(result.ticker),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const positive = (quote?.changePercent ?? 0) >= 0;

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
      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
        {result.name}
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">
        {result.sector || "--"}
      </td>
      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
        {result.exchange || "--"}
      </td>
    </tr>
  );
}
