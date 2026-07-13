"use client";

import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { ComplianceGauge } from "@/components/portfolio/compliance-gauge";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { ActivityFeed } from "@/components/portfolio/activity-feed";
import { TopHoldings } from "@/components/portfolio/top-holdings";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Search } from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
  const { data, isLoading, isError, refetch } = usePortfolio(true);

  const summaryLoading = isLoading || !data;

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Your virtual portfolio overview and compliance health.
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

  const compliantCount =
    data?.positions?.filter((p) => p.complianceVerdict === "COMPLIANT")
      .length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Your virtual portfolio overview and compliance health.
        </p>
      </div>

      <PortfolioSummary
        totalValueCents={data?.totalValueCents}
        buyingPowerCents={data?.buyingPowerCents}
        overallComplianceScore={data?.overallComplianceScore}
        isLoading={summaryLoading}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {data?.positions && data.positions.length > 0 ? (
            <PortfolioTable
              positions={data.positions}
              isLoading={isLoading}
            />
          ) : !isLoading ? (
            <EmptyState
              icon={Search}
              title="Your portfolio is empty"
              description="Search for an asset to place your first paper trade."
              action={
                <Link
                  href="/"
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Search Assets
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
              <ComplianceGauge
                score={data.overallComplianceScore}
                totalPositions={data.positions.length}
                compliantCount={compliantCount}
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
