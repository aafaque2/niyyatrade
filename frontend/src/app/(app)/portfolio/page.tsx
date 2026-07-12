"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";

export default function PortfolioPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = usePortfolio(true);

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
        isLoading={isLoading}
      />

      <PortfolioTable
        positions={data?.positions ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
