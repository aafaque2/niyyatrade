"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useComplianceFrameworkStore } from "@/lib/stores/compliance-framework-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { DashboardSummary } from "@/components/portfolio/dashboard-summary";
import { PortfolioComplianceGauge } from "@/components/portfolio/portfolio-compliance-gauge";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { ActivityFeed } from "@/components/portfolio/activity-feed";
import { TopHoldings } from "@/components/portfolio/top-holdings";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Search } from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
  const { data, isLoading, isError, refetch } = usePortfolio(true);
  const selectedFrameworks = useComplianceFrameworkStore((s) => s.selectedFrameworks);
  const userCurrency = useAuthStore((s) => s.user?.currency ?? "USD");

  const summaryLoading = isLoading || !data;

  if (isError) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your portfolio overview and compliance health.
          </p>
        </div>
        <ErrorState
          title="Failed to load portfolio"
          message="There was an error loading your portfolio data."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const positionTickers = data?.positions?.map((p) => p.ticker) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your portfolio overview and compliance health.
        </p>
      </div>

      <DashboardSummary
        totalValueCents={data?.totalValueCents}
        buyingPowerCents={data?.buyingPowerCents}
        overallComplianceScore={data?.overallComplianceScore}
        baseCurrency={userCurrency}
        isLoading={summaryLoading}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {data?.positions && data.positions.length > 0 ? (
            <PortfolioTable
              positions={data.positions}
              frameworkSlugs={selectedFrameworks}
              isLoading={isLoading}
            />
          ) : !isLoading ? (
            <EmptyState
              icon={Search}
              title="Your portfolio is empty"
              description="Search for an asset to place your first paper trade."
              action={
                <Link
                  href="/markets"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-emerald-muted"
                >
                  Browse Markets
                </Link>
              }
            />
          ) : null}

          <ActivityFeed
            orders={data?.recentOrders ?? []}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {data && data.positions.length > 0 && (
            <>
              <PortfolioComplianceGauge
                tickers={positionTickers}
                frameworkSlugs={selectedFrameworks}
              />
              <TopHoldings
                positions={data.positions}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
