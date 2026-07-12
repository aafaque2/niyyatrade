export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Order history and compliance audit log.
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No order history yet.
      </div>
    </div>
  );
}
