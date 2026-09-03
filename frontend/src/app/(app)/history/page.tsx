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
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";

export default function HistoryPage() {
  const [tab, setTab] = useState("orders");
  const [pageOrders, setPageOrders] = useState(1);
  const [pageCompliance, setPageCompliance] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useOrderHistory(pageOrders);
  const {
    data: complianceData,
    isLoading: complianceLoading,
    isFetching: complianceFetching,
    isError: complianceError,
    refetch: refetchCompliance,
  } = useComplianceHistory(pageCompliance);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Order history and compliance audit log.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v ?? "orders"); }}>
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
              <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : ""} aria-live="polite" aria-busy={isFetching}>
                <OrdersTable items={data.items} />
              </div>

              {data.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    Page {data.page} of {data.pages} ({data.total} total)
                    {isFetching && !isLoading ? " • Updating…" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Previous orders page"
                      disabled={pageOrders <= 1 || isFetching}
                      onClick={() => setPageOrders((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Next orders page"
                      disabled={pageOrders >= (data.pages ?? 1) || isFetching}
                      onClick={() => setPageOrders((p) => p + 1)}
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

          {complianceData && complianceData.items.length > 0 && (
            <>
              <div className={complianceFetching && !complianceLoading ? "opacity-60 transition-opacity" : ""} aria-live="polite" aria-busy={complianceFetching}>
                <ComplianceTable items={complianceData.items} />
              </div>

              {complianceData.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    Page {complianceData.page} of {complianceData.pages} ({complianceData.total} total)
                    {complianceFetching && !complianceLoading ? " • Updating…" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Previous compliance page"
                      disabled={pageCompliance <= 1 || complianceFetching}
                      onClick={() => setPageCompliance((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Next compliance page"
                      disabled={pageCompliance >= (complianceData.pages ?? 1) || complianceFetching}
                      onClick={() => setPageCompliance((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty owned by ComplianceTable itself (it renders EmptyState for 0 items) — no duplicate here. Only show when loaded and empty. */}
          {complianceData && complianceData.items.length === 0 && !complianceLoading && !complianceError && (
            <ComplianceTable items={[]} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
