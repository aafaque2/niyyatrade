export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Track your watched assets and their compliance status.
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Your watchlist is empty. Search for an asset to add it.
      </div>
    </div>
  );
}
