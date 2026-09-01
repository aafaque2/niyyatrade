"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { searchAssets, type SearchResult, getQuotes, type MarketQuote } from "@/lib/services/market-data";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, WifiOff, Globe, MapPin, TrendingUp, TrendingDown, BarChart2, Layout } from "lucide-react";

type SortField = "ticker" | "name" | "sector" | "price" | "change" | "marketcap";
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

// ── Popular Indices ──────────────────────────────────────────────
const POPULAR_INDICES = [
  { label: "NIFTY 50", ticker: "^NSEI" },
  { label: "SENSEX", ticker: "^BSESN" },
  { label: "S&P 500", ticker: "^GSPC" },
  { label: "NASDAQ", ticker: "^IXIC" },
  { label: "FTSE 100", ticker: "^FTSE" },
  { label: "DAX 30", ticker: "^GDAXI" },
] as const;

// ── Filter pills ────────────────────────────────────────────────
const EXCHANGE_PILLS = [
  { label: "All Exchanges", value: "all" },
  { label: "NSE (India)", value: "NSE" },
  { label: "BSE (India)", value: "BSE" },
  { label: "NYSE (USA)", value: "NYSE" },
  { label: "NASDAQ (USA)", value: "NASDAQ" },
  { label: "LSE (UK)", value: "LSE" },
  { label: "XETRA (Germany)", value: "XETRA" },
  { label: "ADX (UAE)", value: "ADX" },
] as const;

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
] as const;

// ── Page component ───────────────────────────────────────────────
export default function MarketsPage() {
  // ── Search & filters ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError } = useQuery({
    queryKey: ["market-search", debouncedQuery || "all"],
    queryFn: () => searchAssets(debouncedQuery || "a"),
    staleTime: 30_000,
    retry: 1,
  });

  // ── Enrich with live quotes ────────────────────────────────────
  const resultTickers = useMemo(() => {
    if (!searchResults) return [];
    return [...new Set(searchResults.map((r) => r.ticker))];
  }, [searchResults]);

  const { data: marketQuotes, isLoading: isQuotesLoading, isError: isQuotesError } = useQuery<Record<string, MarketQuote>>({
    queryKey: ["quotes", ...resultTickers],
    queryFn: async () => {
      const rawQuotes = await getQuotes(resultTickers);
      return rawQuotes.reduce((acc, q) => { acc[q.ticker] = q; return acc; }, {} as Record<string, MarketQuote>);
    },
    staleTime: 20_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // ── Sort state ────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Apply filters & sort ───────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchResults) return [];
    let items = [...searchResults];

    // Exchange filter (ticker suffix or exchange field)
    if (selectedExchange !== "all") {
      items = items.filter((r) => r.exchange?.toUpperCase() === selectedExchange.toUpperCase());
    }

    // Sector filter
    if (selectedSector !== "All Sectors") {
      items = items.filter(
        (r) => (r.sector ?? "").toLowerCase() === selectedSector.toLowerCase(),
      );
    }

    // Search filter (ticker or name)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter(
        (r) => r.ticker.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q),
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "ticker") cmp = a.ticker.localeCompare(b.ticker);
      else if (sortField === "name") cmp = (a.name ?? "").localeCompare(b.name ?? "");
      else if (sortField === "sector") cmp = (a.sector ?? "").localeCompare(b.sector ?? "");
      else if (sortField === "price") {
        const qa = marketQuotes?.[a.ticker]?.priceCents ?? 0;
        const qb = marketQuotes?.[b.ticker]?.priceCents ?? 0;
        cmp = qa === qb ? 0 : qa > qb ? 1 : -1;
      } else if (sortField === "change") {
        const qa = marketQuotes?.[a.ticker]?.changePercent ?? 0;
        const qb = marketQuotes?.[b.ticker]?.changePercent ?? 0;
        cmp = qa === qb ? 0 : qa > qb ? 1 : -1;
      } else if (sortField === "marketcap") {
        // rough estimate: priceCents * 10_000 / 100 as placeholder
        const qa = marketQuotes?.[a.ticker]?.priceCents ?? 0;
        const qb = marketQuotes?.[b.ticker]?.priceCents ?? 0;
        cmp = qa === qb ? 0 : qa > qb ? 1 : -1;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [searchResults, selectedExchange, selectedSector, debouncedQuery, sortField, sortDir, marketQuotes]);

  // ── Indices quotes (separate fetch, not part of main table) ────
  const indicesTickers = POPULAR_INDICES.map((i) => i.ticker);
  const { data: indicesQuotes, isLoading: isIndicesLoading } = useQuery<Record<string, MarketQuote | undefined>>({
    queryKey: ["quotes", ...indicesTickers],
    queryFn: async () => {
      const raw = await getQuotes(indicesTickers);
      return raw.reduce((acc, q) => { acc[q.ticker] = q; return acc; }, {} as Record<string, MarketQuote | undefined>);
    },
    staleTime: 15_000,
    retry: 2,
  });

  // ── Right-rail data ────────────────────────────────────────────
  const gainers = useMemo(() => {
    if (!marketQuotes) return [];
    return Object.entries(marketQuotes)
      .filter(([, q]) => q.changePercent && q.changePercent > 0)
      .map(([ticker, q]) => ({ ticker, changePercent: q.changePercent }))
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  }, [marketQuotes]);

  const losers = useMemo(() => {
    if (!marketQuotes) return [];
    return Object.entries(marketQuotes)
      .filter(([, q]) => q.changePercent && q.changePercent < 0)
      .map(([ticker, q]) => ({ ticker, changePercent: q.changePercent }))
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
  }, [marketQuotes]);

  // Sector heatmap: group by sector from searchResults, compute avg change
  const sectorHeatmap = useMemo(() => {
    if (!searchResults || !marketQuotes) return [] as { sector: string; avgChange: number }[];
    const map = new Map<string, { total: number; count: number }>();
    searchResults.forEach((r) => {
      const q = marketQuotes[r.ticker];
      if (!q) return;
      const se = r.sector ?? "Unknown";
      const entry = map.get(se) ?? { total: 0, count: 0 };
      entry.total += q.changePercent ?? 0;
      entry.count += 1;
      map.set(se, entry);
    });
    return Array.from(map.entries())
      .filter((e) => e[1].count > 0)
      .map((e) => ({
        sector: e[1].total !== undefined ? e[1].total / e[1].count : 0,
        avgChange: e[1].total / e[1].count,
      }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [searchResults, marketQuotes]);

  // ── Table rendering ────────────────────────────────────────────
  const noResults =
    !isSearchLoading &&
    !isSearchError &&
    filtered.length === 0 &&
    !!debouncedQuery.trim();

  return (
    <div className="space-y-5">
      <div className="border-b border-border bg-surface/50 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 sm:py-3 px-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Markets</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Browse and search available equities.
            </p>
          </div>

          {/* Indices strip */}
          <div className="flex flex-wrap gap-2">
            {POPULAR_INDICES.map((idx) => {
              const idxQuote = indicesQuotes?.[idx.ticker];
              const price = idxQuote?.priceCents ? Number(idxQuote.priceCents) / 100 : null;
              const change = idxQuote?.changePercent ?? 0;
              const changeSigned = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
              return (
                <div
                  key={idx.ticker}
                  className="rounded-xl border border-border bg-surface/50 p-2 min-w-[120px] flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-mono text-primary">{idx.label}</span>
                  <span className="text-xs font-semibold">
                    {price !== null ? `${price.toFixed(2)}` : "--"}
                  </span>
                  <span
                    className={change >= 0 ? "text-xxs font-medium text-positive" : "text-xxs font-medium text-negative"}
                  >
                    {changeSigned}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters area */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center px-4 py-2">
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
          value={selectedExchange}
          onChange={(e) => setSelectedExchange(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
        >
          {EXCHANGE_PILLS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

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

      {/* Table */}
      {isSearchLoading || isQuotesLoading || isIndicesLoading ? (
        <div className="rounded-lg border border-border">
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
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
                  <th className="px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Company <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("sector")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Sector <SortIcon field="sector" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Change
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((result) => {
                  const quote = marketQuotes?.[result.ticker];
                  const priceCents = quote?.priceCents ?? result.currency ? null : 0;
                  const price = priceCents != null ? Number(priceCents) / 100 : null;
                  const changePercent = quote?.changePercent ?? 0;
                  const changeSigned = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
                  const changeBadgeClass = changePercent >= 0 ? "positive" : "negative";

                  return (
                    <tr
                      key={result.ticker}
                      className="border-b border-border transition-colors hover:bg-surface-hover/50 last:border-b-0"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/assets/${result.ticker}`}
                          className="text-xs font-semibold font-mono text-primary hover:underline"
                        >
                          {result.ticker}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-foreground max-w-[200px] truncate">
                        {result.name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {result.sector || "--"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {price != null ? (
                          <>
                            <span className="font-mono text-primary">
                              {formatCents(priceCents ?? 0, result.currency ?? "USD")}
                            </span>
                            <span className="text-xs opacity-60"> {price.toFixed(2)}</span>
                          </>
                        ) : (
                          "<span className=\"text-muted-foreground\">--</span>"
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <span className={`font-medium ${changeBadgeClass}`}>
                          {changeSigned}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <span className={`font-medium ${changeBadgeClass}`}>
                          {changeSigned}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {/* Rough market-cap estimate: price * 10^7 / 100 for display */}
                        {price != null ? (
                          <span>{(price * 100).toLocaleString()}K</span>
                        ) : (
                          "<span className=\"text-muted-foreground\">--</span>"
                        )}
                      </td>
                    </tr>
                  );
                })}

                {isSearchError && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <WifiOff className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      Couldn&apos;t load markets. Check your connection and try again.
                    </td>
                  </tr>
                )}
                {!isQuotesError && noResults && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No assets found. Try a different search term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!isSearchLoading && !isQuotesLoading && !isIndicesLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} asset{filtered.length !== 1 ? "s" : ""} markets
        </p>
      )}

      {/* Right rail — Top Movers & Sector Heatmap  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Movers */}
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <h2 className="mb-3 text-xs font-medium text-muted-foreground">Top Movers</h2>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-positive">Gainers</span>
              <GainingList items={gainers} marketQuotes={marketQuotes ?? {}} />
            </div>
            <div>
              <span className="text-xs font-medium text-negative">Losers</span>
              <LosingList items={losers} marketQuotes={marketQuotes ?? {}} />
            </div>
          </div>
        </div>

        {/* Sector Heatmap */}
        <div className="rounded-lg border border-border bg-surface/50 p-3 h-full">
          <h2 className="mb-3 text-xs font-medium text-muted-foreground">Sector Heatmap</h2>
          {sectorHeatmap.length > 0 ? (
            <div className="space-y-1">
              {sectorHeatmap.map((s, i) => {
                const hue = Math.round((1 - (s.avgChange + 10) / 20) * 120); // simple mapping -10% to +10% → 0 to 120
                const color = `hsl(${hue}, 70%, 60%)`;
                return (
                  <div
                    key={s.sector}
                    className="flex items-center justify-between text-xs"
                    style={{ color }}
                  >
                    <span>{s.sector}</span>
                    <span
                      className={`font-medium ${s.avgChange >= 0 ? "positive" : "negative"}`}
                    >
                      {s.avgChange.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Helper subcomponents ---- */

/* Gaining/Losing list */
function GainingList({ items, marketQuotes }: { items: { ticker: string; changePercent: number }[]; marketQuotes: Record<string, MarketQuote | undefined> }) {
  return (
    <ul className="text-xs">
      {items.map((it) => {
        const q = marketQuotes[it.ticker];
        const price = q?.priceCents ? Number(q.priceCents) / 100 : null;
        return (
          <li key={it.ticker} className="flex items-center gap-1.5">
            <span className="font-mono text-primary">{it.ticker}</span>
            <span className="text-primary">{price != null ? price.toFixed(2) : "--"}</span>
            <span className="text-positive">{it.changePercent.toFixed(1)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function LosingList({ items, marketQuotes }: { items: { ticker: string; changePercent: number }[]; marketQuotes: Record<string, MarketQuote | undefined> }) {
  return (
    <ul className="text-xs">
      {items.map((it) => {
        const q = marketQuotes[it.ticker];
        const price = q?.priceCents ? Number(q.priceCents) / 100 : null;
        return (
          <li key={it.ticker} className="flex items-center gap-1.5">
            <span className="font-mono text-primary">{it.ticker}</span>
            <span className="text-primary">{price != null ? price.toFixed(2) : "--"}</span>
            <span className="text-negative">{it.changePercent.toFixed(1)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/* formatCents helper (inline to avoid extra imports) */
function formatCents(cents: number, currency?: string) {
  const formatted = Math.abs(cents).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency && currency !== "USD" ? `${formatted} ${currency}` : `$${formatted}`;
}