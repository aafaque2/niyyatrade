import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AssetHeader } from "@/components/asset/asset-header";
import { KeyStats } from "@/components/asset/key-stats";
import { AssetPageClient } from "./client";

const AssetChart = dynamic(
  () => import("@/components/charts/asset-chart").then((m) => ({ default: m.AssetChart })),
  { loading: () => <div className="h-[360px] w-full animate-pulse rounded-lg bg-surface/50" /> },
);

const ComplianceCard = dynamic(
  () => import("@/components/compliance/compliance-card").then((m) => ({ default: m.ComplianceCard })),
  { loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-surface/50" /> },
);

const OrderTicket = dynamic(
  () => import("@/components/trading/order-ticket").then((m) => ({ default: m.OrderTicket })),
  { loading: () => <div className="h-48 w-full animate-pulse rounded-lg bg-surface/50" /> },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  return {
    title: `${symbol} — NiyyaTrade`,
    description: `View compliance analysis, charts, and trading for ${symbol} on NiyyaTrade.`,
  };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-5">
      <AssetPageClient ticker={ticker}>
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border border-border bg-surface/50 p-4">
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
