import { AssetHeader } from "@/components/asset/asset-header";
import { AssetChart } from "@/components/charts/asset-chart";
import { ComplianceCard } from "@/components/compliance/compliance-card";
import { OrderTicket } from "@/components/trading/order-ticket";
import { KeyStats } from "@/components/asset/key-stats";
import { AssetPageClient } from "./client";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-6">
      <AssetPageClient ticker={ticker}>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                Price Chart
              </h2>
              <AssetChart ticker={ticker} />
            </div>

            <KeyStats ticker={ticker} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <ComplianceCard ticker={ticker} />
            <OrderTicket ticker={ticker} />
          </div>
        </div>
      </AssetPageClient>
    </div>
  );
}
