"use client";

import { use } from "react";
import { ComplianceCard } from "@/components/compliance/compliance-card";
import { OrderTicket } from "@/components/trading/order-ticket";
import { AssetChart } from "@/components/charts/asset-chart";

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{ticker.toUpperCase()}</h1>
        <p className="text-sm text-muted-foreground">
          Asset evaluation and trading
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Price Chart
            </h2>
            <AssetChart ticker={ticker} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <ComplianceCard ticker={ticker} />
          <OrderTicket ticker={ticker} />
        </div>
      </div>
    </div>
  );
}
