"use client";

import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { AddSymbol } from "@/components/watchlist/add-symbol";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Eye } from "lucide-react";

export default function WatchlistPage() {
  const { data, isLoading, isError, refetch } = useWatchlist();

  if (isError) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Watchlist</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track your watched assets and their compliance status.
          </p>
        </div>
        <ErrorState
          title="Failed to load watchlist"
          message="There was an error loading your watchlist."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const items = data ?? [];
  const tickers = items.map((i) => i.ticker);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Track your watched assets and their compliance status.
        </p>
      </div>

      <AddSymbol existingTickers={tickers} />

      {items.length > 0 ? (
        <WatchlistTable items={items} />
      ) : (
        !isLoading && (
          <EmptyState
            icon={Eye}
            title="Your watchlist is empty"
            description="Search for assets above to add them to your watchlist."
          />
        )
      )}
    </div>
  );
}
