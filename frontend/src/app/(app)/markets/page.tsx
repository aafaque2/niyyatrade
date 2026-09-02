"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { searchAssets, getQuotes, type MarketQuote, type SearchResult } from "@/lib/services/market-data";
import { searchAssetsDB } from "@/lib/services/asset";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatCents, deriveCurrencyFromTicker } from "@/lib/utils";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
  Globe,
  Bookmark,
  ChevronRight,
  Clock3,
} from "lucide-react";

type SortField = "ticker" | "name" | "price" | "change" | "sector";
type SortDir = "asc" | "desc";

const POPULAR_INDICES: readonly { label: string; ticker: string; sub: string }[] = [
  { label: "NIFTY 50", ticker: "^NSEI", sub: "NSE" },
  { label: "SENSEX", ticker: "^BSESN", sub: "BSE" },
  { label: "S&P 500", ticker: "^GSPC", sub: "NYSE" },
  { label: "NASDAQ", ticker: "^IXIC", sub: "NASDAQ" },
  { label: "FTSE 100", ticker: "^FTSE", sub: "LSE" },
  { label: "DAX 40", ticker: "^GDAXI", sub: "XETRA" },
] as const;

const INDICES_FALLBACK: Record<string, { priceCents: number; changePercent: number; currency: string }> = {
  "^NSEI": { priceCents: 2520000, changePercent: 0.42, currency: "INR" },
  "^BSESN": { priceCents: 8240000, changePercent: 0.38, currency: "INR" },
  "^GSPC": { priceCents: 540000, changePercent: 0.91, currency: "USD" },
  "^IXIC": { priceCents: 1700000, changePercent: 1.12, currency: "USD" },
  "^FTSE": { priceCents: 880000, changePercent: -0.18, currency: "GBP" },
  "^GDAXI": { priceCents: 1850000, changePercent: 0.64, currency: "EUR" },
};

const EXCHANGE_PILLS: readonly { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "NSE", value: "NSE" },
  { label: "BSE", value: "BSE" },
  { label: "NASDAQ", value: "NASDAQ" },
  { label: "NYSE", value: "NYSE" },
  { label: "LSE", value: "LSE" },
  { label: "XETRA", value: "XETRA" },
];

const SECTORS: readonly string[] = [
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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
}

function initials(ticker: string) {
  const clean = ticker.replace(/^\^/, "").replace(/\..*$/, "");
  return clean.slice(0, 2).toUpperCase();
}

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        positive ? "bg-emerald-subtle text-emerald-light" : "bg-danger/10 text-danger",
      )}
    >
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [moversTab, setMoversTab] = useState<"gainers" | "losers">("gainers");
  const debouncedQuery = useDebounce(searchQuery, 400);

  const {
    data: assetPages,
    isLoading: isSearchLoading,
    isError: isSearchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["asset-search", debouncedQuery, selectedExchange, selectedSector],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      try {
        const res = await searchAssetsDB({
          q: debouncedQuery,
          sector: selectedSector,
          exchange: selectedExchange,
          limit: 50,
          cursor: pageParam,
        });
        if (res.data.length > 0) return res;
        if (debouncedQuery) return res;
        const fallback = await searchAssets(debouncedQuery || "a");
        return { data: fallback, nextCursor: null, hasMore: false, total: fallback.length };
      } catch {
        const fallback = await searchAssets(debouncedQuery || "a");
        return { data: fallback, nextCursor: null, hasMore: false, total: fallback.length };
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: 1,
  });

  const searchResults = useMemo(() => assetPages?.pages.flatMap((p) => p.data) ?? [], [assetPages]);
  const searchTotal = assetPages?.pages[0]?.total ?? searchResults.length;
  const hasMoreAssets = assetPages?.pages[assetPages.pages.length - 1]?.hasMore ?? false;

  const resultTickers = useMemo(() => {
    if (!searchResults) return [];
    return [...new Set(searchResults.map((r) => r.ticker))].slice(0, 50);
  }, [searchResults]);

  const { data: quotesMap, isLoading: isQuotesLoading } = useQuery<Record<string, MarketQuote>>({
    queryKey: ["quotes", ...resultTickers],
    queryFn: async () => {
      if (resultTickers.length === 0) return {};
      const raw = await getQuotes(resultTickers);
      return raw.reduce((acc, q) => {
        acc[q.ticker] = q;
        return acc;
      }, {} as Record<string, MarketQuote>);
    },
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: resultTickers.length > 0,
  });

  const indicesTickers = useMemo(() => POPULAR_INDICES.map((i) => i.ticker), []);
  const { data: indicesMap } = useQuery<Record<string, MarketQuote>>({
    queryKey: ["indices-quotes", ...indicesTickers],
    queryFn: async () => {
      const raw = await getQuotes(indicesTickers);
      return raw.reduce((acc, q) => {
        acc[q.ticker] = q;
        return acc;
      }, {} as Record<string, MarketQuote>);
    },
    staleTime: 12_000,
    refetchInterval: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    if (!searchResults) return [];
    let items = [...searchResults];

    if (selectedExchange !== "all") {
      const v = selectedExchange.toUpperCase();
      items = items.filter((r) => (r.exchange ?? "").toUpperCase() === v);
    }
    if (selectedSector !== "All Sectors") {
      const s = selectedSector.toLowerCase();
      items = items.filter((r) => (r.sector ?? "").toLowerCase() === s);
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter((r) => r.ticker.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "ticker") cmp = a.ticker.localeCompare(b.ticker);
      else if (sortField === "name") cmp = (a.name ?? "").localeCompare(b.name ?? "");
      else if (sortField === "sector") cmp = (a.sector ?? "").localeCompare(b.sector ?? "");
      else if (sortField === "price") {
        const qa = quotesMap?.[a.ticker]?.priceCents ?? 0;
        const qb = quotesMap?.[b.ticker]?.priceCents ?? 0;
        cmp = qa - qb;
      } else if (sortField === "change") {
        const qa = quotesMap?.[a.ticker]?.changePercent ?? 0;
        const qb = quotesMap?.[b.ticker]?.changePercent ?? 0;
        cmp = qa - qb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [searchResults, selectedExchange, selectedSector, debouncedQuery, sortField, sortDir, quotesMap]);

  const { gainers, losers } = useMemo(() => {
    if (!quotesMap) return { gainers: [] as { ticker: string; q: MarketQuote }[], losers: [] as { ticker: string; q: MarketQuote }[] };
    const entries = Object.entries(quotesMap) as [string, MarketQuote][];
    const g = entries
      .filter(([, q]) => (q.changePercent ?? 0) > 0)
      .sort((a, b) => (b[1].changePercent ?? 0) - (a[1].changePercent ?? 0))
      .slice(0, 5)
      .map(([ticker, q]) => ({ ticker, q }));
    const l = entries
      .filter(([, q]) => (q.changePercent ?? 0) < 0)
      .sort((a, b) => (a[1].changePercent ?? 0) - (b[1].changePercent ?? 0))
      .slice(0, 5)
      .map(([ticker, q]) => ({ ticker, q }));
    return { gainers: g, losers: l };
  }, [quotesMap]);

  const sectorHeatmap = useMemo(() => {
    if (!searchResults || !quotesMap) return [] as { sector: string; avg: number; count: number }[];
    const map = new Map<string, { total: number; count: number }>();
    for (const r of searchResults) {
      const q = quotesMap[r.ticker];
      if (!q || q.changePercent == null) continue;
      const sector = r.sector ?? "Unknown";
      const cur = map.get(sector) ?? { total: 0, count: 0 };
      cur.total += q.changePercent;
      cur.count += 1;
      map.set(sector, cur);
    }
    return Array.from(map.entries())
      .map(([sector, v]) => ({ sector, avg: v.total / v.count, count: v.count }))
      .filter((x) => x.count >= 1 && x.sector !== "Unknown")
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [searchResults, quotesMap]);

  const isLoading = isSearchLoading || isQuotesLoading;
  const noResults = !isSearchLoading && !isSearchError && filtered.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
                Live
              </span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                Market data refreshes every 20s
              </span>
            </p>
          </div>
          <Link
            href="/watchlist"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <Bookmark className="h-4 w-4 text-primary" />
            Watchlist
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>

        {/* Indices strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {POPULAR_INDICES.map((idx) => {
            const fb = INDICES_FALLBACK[idx.ticker];
            const q = indicesMap?.[idx.ticker];
            const price = q?.priceCents ?? fb?.priceCents ?? null;
            const currency = q?.currency ?? fb?.currency ?? (idx.ticker.startsWith("^NSE") || idx.ticker.startsWith("^BSE") ? "INR" : "USD");
            const change = q?.changePercent ?? fb?.changePercent ?? 0;
            const positive = change >= 0;
            return (
              <div
                key={idx.ticker}
                className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface to-surface/60 p-4 transition-colors hover:border-border/80 hover:from-surface-hover hover:to-surface/60"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-60" />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{idx.label}</p>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{idx.sub}</span>
                </div>
                <p className="mt-3 font-mono text-[18px] font-semibold leading-none tracking-tight text-foreground">
                  {price != null ? formatCents(price, currency) : <span className="text-muted-foreground">—</span>}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none",
                      positive ? "bg-emerald-subtle text-emerald-light" : "bg-danger/10 text-danger",
                    )}
                  >
                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {positive ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">{q ? "Today" : "Delayed"}</span>
                </div>
                {/* subtle sparkline */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28px] opacity-30">
                  <svg viewBox="0 0 100 28" className="h-full w-full" preserveAspectRatio="none">
                    <path
                      d={positive ? "M0 18 L20 14 L40 16 L60 10 L80 12 L100 8" : "M0 8 L20 12 L40 10 L60 16 L80 14 L100 18"}
                      fill="none"
                      stroke={positive ? "#22c55e" : "#ef4444"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticker or company — e.g. RELIANCE, TCS, AAPL"
                className="h-10 rounded-xl border-border bg-surface pl-10 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-green pb-1 lg:pb-0">
              <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                <Globe className="h-3.5 w-3.5" />
                Exchange
              </span>
              <div className="flex items-center gap-1.5">
                {EXCHANGE_PILLS.map((p) => {
                  const active = selectedExchange === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setSelectedExchange(p.value)}
                      className={cn(
                        "h-8 shrink-0 rounded-full border px-3.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-surface text-muted-foreground hover:border-border/80 hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Sector
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => {
                const active = selectedSector === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSector(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium leading-none transition-colors",
                      active
                        ? "border-primary bg-emerald-subtle text-emerald-light"
                        : "border-border bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {(selectedExchange !== "all" || selectedSector !== "All Sectors" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedExchange("all");
                  setSelectedSector("All Sectors");
                  setSearchQuery("");
                }}
                className="ml-auto text-xs font-medium text-primary hover:text-emerald-light"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* Table */}
        <div className="min-w-0 xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2 className="text-sm font-semibold">Equities</h2>
                <Badge variant="secondary" className="rounded-full bg-secondary px-2 py-0 text-[11px] font-medium text-muted-foreground">
                  {searchTotal} assets
                </Badge>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                Live prices
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-4 last:border-0">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : isSearchError ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
                  <WifiOff className="h-6 w-6 text-danger" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">Unable to load markets</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Check your connection and try again. Market data is temporarily unavailable.</p>
              </div>
            ) : noResults ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">No matches for &quot;{debouncedQuery}&quot;</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try a different ticker, company name, or adjust filters.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                <table className="w-full min-w-[640px] lg:min-w-0 lg:table-fixed">
                  <colgroup>
                    <col className="w-[42%] lg:w-[38%]" />
                    <col className="w-[18%] lg:w-[16%]" />
                    <col className="w-[16%] lg:w-[16%]" />
                    <col className="w-[14%] lg:w-[18%]" />
                    <col className="w-[10%] lg:w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="px-3 py-3 text-left lg:px-4">
                        <button
                          onClick={() => handleSort("ticker")}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Asset
                          <SortIcon active={sortField === "ticker"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right lg:px-4">
                        <button
                          onClick={() => handleSort("price")}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Price
                          <SortIcon active={sortField === "price"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right lg:px-4">
                        <button
                          onClick={() => handleSort("change")}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        >
                          24h
                          <SortIcon active={sortField === "change"} dir={sortDir} />
                        </button>
                      </th>
                      <th className="hidden px-3 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:table-cell lg:px-4">
                        Sector
                      </th>
                      <th className="px-3 py-3 text-right lg:px-4">
                        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Trade</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((r) => {
                      const q = quotesMap?.[r.ticker];
                      const currency = q?.currency ?? r.currency ?? deriveCurrencyFromTicker(r.ticker);
                      const priceCents = q?.priceCents;
                      const change = q?.changePercent ?? 0;
                      const hasQuote = priceCents != null;
                      return (
                        <tr key={r.ticker} className="group transition-colors hover:bg-surface-hover/40">
                          <td className="px-3 py-3.5 lg:px-4">
                            <Link href={`/assets/${r.ticker}`} className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-[11px] font-semibold tracking-wide text-foreground">
                                {initials(r.ticker)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium leading-tight text-foreground group-hover:text-primary">
                                  {r.name ?? r.ticker}
                                </p>
                                <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                                  <span className="shrink-0 font-mono">{r.ticker}</span>
                                  <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                                  <span className="truncate">{r.exchange ?? "—"}</span>
                                  <span className="hidden truncate sm:inline">• {r.currency ?? deriveCurrencyFromTicker(r.ticker)}</span>
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right lg:px-4">
                            {hasQuote ? (
                              <span className="font-mono text-[13px] font-medium text-foreground">
                                {formatCents(priceCents, currency)}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right lg:px-4">
                            {hasQuote ? <ChangePill value={change} /> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="hidden whitespace-nowrap px-3 py-3.5 sm:table-cell lg:px-4">
                            <Badge
                              variant="secondary"
                              className="max-w-[140px] truncate rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                              title={r.sector ?? undefined}
                            >
                              {r.sector ?? "—"}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right lg:px-4">
                            <Link
                              href={`/assets/${r.ticker}`}
                              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-emerald-subtle hover:text-emerald-light"
                            >
                              Trade
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {hasMoreAssets && (
              <div className="border-t border-border bg-surface/30 px-4 py-3 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-4 text-xs font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading…" : `Load more — ${searchTotal - filtered.length} remaining`}
                </button>
              </div>
            )}
          </div>

          {!isLoading && filtered.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {searchTotal} assets
              {debouncedQuery ? ` for “${debouncedQuery}”` : ""} {selectedExchange !== "all" ? `• ${selectedExchange}` : ""}{" "}
              {selectedSector !== "All Sectors" ? `• ${selectedSector}` : ""}
              {hasMoreAssets ? " • scroll or load more" : ""}
            </p>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4 xl:col-span-4">
          {/* Top movers */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Movers
              </h2>
              <div className="flex rounded-full border border-border bg-surface p-0.5">
                <button
                  onClick={() => setMoversTab("gainers")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    moversTab === "gainers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Gainers
                </button>
                <button
                  onClick={() => setMoversTab("losers")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    moversTab === "losers" ? "bg-danger text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Losers
                </button>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              {(moversTab === "gainers" ? gainers : losers).length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">No {moversTab} in current universe</p>
              ) : (
                (moversTab === "gainers" ? gainers : losers).map(({ ticker, q }, idx) => {
                  const currency = q.currency ?? deriveCurrencyFromTicker(ticker);
                  return (
                    <Link
                      key={ticker}
                      href={`/assets/${ticker}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover/40"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-foreground">{ticker}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {searchResults?.find((r) => r.ticker === ticker)?.name ?? ticker}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs font-medium text-foreground">{formatCents(q.priceCents, currency)}</p>
                        <p className={cn("text-[11px] font-medium", (q.changePercent ?? 0) >= 0 ? "text-emerald-light" : "text-danger")}>
                          {(q.changePercent ?? 0) >= 0 ? "+" : ""}
                          {(q.changePercent ?? 0).toFixed(2)}%
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Sector heatmap */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-surface/40 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Sector Performance</h2>
              <span className="ml-auto text-[11px] text-muted-foreground">Today</span>
            </div>

            {sectorHeatmap.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">No sector data for current filters</p>
            ) : (
              <div className="p-3">
                <div className="grid gap-2">
                  {sectorHeatmap.map((s) => {
                    const positive = s.avg >= 0;
                    const intensity = Math.min(Math.abs(s.avg) / 4, 1); // 0..1 for 0-4%
                    return (
                      <div key={s.sector} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5 transition-colors hover:bg-surface">
                        <div
                          className={cn(
                            "h-8 w-1 shrink-0 rounded-full",
                            positive ? "bg-emerald" : "bg-danger",
                          )}
                          style={{ opacity: 0.35 + intensity * 0.65 }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">{s.sector}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {s.count} {s.count === 1 ? "asset" : "assets"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                            positive ? "bg-emerald-subtle text-emerald-light" : "bg-danger/10 text-danger",
                          )}
                        >
                          {positive ? "+" : ""}
                          {s.avg.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-danger" />
                    Lagging
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Leading
                    <span className="h-2 w-2 rounded-full bg-emerald" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Coverage
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              US, India, UK &amp; EU equities via consolidated feed. Search &ldquo;a&rdquo; to browse the full universe. Quotes are delayed and for paper trading only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
