"use client";

import { useState } from "react";
import { useOrderHistory, useComplianceHistory } from "@/lib/hooks/use-history";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrdersTable } from "@/components/history/orders-table";
import { ComplianceTable } from "@/components/history/compliance-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, Shield, ChevronLeft, ChevronRight } from "lucide-react";

export default function HistoryPage() {
  const [tab, setTab] = useState("orders");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useOrderHistory(page);
  const {
    data: complianceData,
    isLoading: complianceLoading,
    isError: complianceError,
    refetch: refetchCompliance,
  } = useComplianceHistory(page);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Order history and compliance audit log.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v ?? "orders"); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-4">
          {isError && (
            <ErrorState
              title="Failed to load order history"
              message="There was an error loading your order history."
              onRetry={() => refetch()}
            />
          )}

          {isLoading && (
            <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              description="Start trading to see your order history here."
            />
          )}

          {data && data.items.length > 0 && (
            <>
              <OrdersTable items={data.items} />

              {data.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {data.page} of {data.pages} ({data.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= (data.pages ?? 1)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-4 space-y-4">
          {complianceError && (
            <ErrorState
              title="Failed to load compliance history"
              message="There was an error loading compliance evaluations."
              onRetry={() => refetchCompliance()}
            />
          )}

          {complianceLoading && (
            <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {complianceData && (
            <>
              <ComplianceTable items={complianceData.items} />

              {complianceData.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {complianceData.page} of {complianceData.pages} ({complianceData.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= (complianceData.pages ?? 1)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {complianceData && complianceData.items.length === 0 && (
            <EmptyState
              icon={Shield}
              title="No compliance history yet"
              description="Compliance evaluations will appear here as you view assets."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
