"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuote } from "@/lib/hooks/use-quote";
import { usePlaceOrder } from "@/lib/hooks/use-place-order";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { useComplianceReport } from "@/lib/hooks/use-compliance-report";
import { useFrameworks } from "@/lib/hooks/use-frameworks";
import { useCancelOrder } from "@/lib/hooks/use-cancel-order";
import { useOrderHistory } from "@/lib/hooks/use-history";
import { formatCents, getCurrencySymbol } from "@/lib/utils";
import { useFxRates, convertCentsWithSnapshot } from "@/lib/hooks/use-fx";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { AuthInterceptModal } from "@/components/auth/auth-intercept-modal";
import {
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";

const HALAL_SLUG = "halal-aaoifi";

export function OrderTicket({ ticker }: { ticker: string }) {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSide, setPendingSide] = useState<"BUY" | "SELL">("BUY");
  const [showShortConfirm, setShowShortConfirm] = useState(false);
  const [halalWarning, setHalalWarning] = useState(false);
  const [showComplianceConfirm, setShowComplianceConfirm] = useState(false);
  const [compliancePendingSide, setCompliancePendingSide] = useState<"BUY" | "SELL" | null>(null);

  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuote(ticker);
  const { data: portfolio } = usePortfolio();
  const { mutate, isPending, isSuccess, error, reset } = usePlaceOrder();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const priceCents = quote?.priceCents ?? 0;
  const currency = quote?.currency ?? "USD";
  const qty = parseFloat(quantity) || 0;
  const effectivePriceCents =
    orderType === "LIMIT" ? Math.round(parseFloat(limitPrice || "0") * 100) : priceCents;
  const estimatedCost = qty * effectivePriceCents;

  const position = portfolio?.positions?.find((p) => p.ticker === ticker);
  const heldQty = position?.quantity ?? 0;
  const halalBlocksShort = portfolio?.activeFrameworkSlug === HALAL_SLUG;
  const userCurrencyFromStore = useAuthStore((s) => s.user?.currency);
  const userCurrency = userCurrencyFromStore ?? "USD";
  const { data: fxSnapshot } = useFxRates();
  const buyingPowerCents = portfolio?.buyingPowerCents ?? 0;
  const priceForMaxBaseCents =
    effectivePriceCents > 0
      ? currency === userCurrency
        ? effectivePriceCents
        : convertCentsWithSnapshot(effectivePriceCents, currency, userCurrency, fxSnapshot)
      : 0;
  const maxBuyQty = priceForMaxBaseCents > 0 ? Math.floor(Number(buyingPowerCents) / priceForMaxBaseCents) : 0;
  const maxSellQty = Math.floor(heldQty);

  // Compliance evaluation for active framework (warn on BUY if non-compliant)
  const activeFrameworkSlug = portfolio?.activeFrameworkSlug ?? undefined;
  const { data: complianceReport } = useComplianceReport(ticker, activeFrameworkSlug);
  const { data: frameworks } = useFrameworks();
  const activeFrameworkName = useMemo(() => {
    if (!activeFrameworkSlug) return null;
    const fw = frameworks?.find((f) => f.slug === activeFrameworkSlug);
    return fw?.name ?? activeFrameworkSlug;
  }, [frameworks, activeFrameworkSlug]);
  const isNonCompliant = complianceReport?.verdict === "NON_COMPLIANT";
  const failedRules = complianceReport?.rules.filter((r) => !r.passed) ?? [];

  // Pending limit orders for this ticker
  const { data: historyData } = useOrderHistory(1, 20);
  const pendingOrders = useMemo(() => {
    if (!historyData?.items) return [];
    return historyData.items.filter((o) => o.ticker === ticker.toUpperCase() && o.status === "PENDING");
  }, [historyData, ticker]);
  const { mutate: cancelMutate, isPending: cancelPending } = useCancelOrder();

  const doMutate = (side: "BUY" | "SELL") => {
    setPendingSide(side);
    reset();
    mutate({
      assetTicker: ticker,
      side,
      quantity: qty,
      orderType,
      ...(orderType === "LIMIT" && effectivePriceCents > 0 ? { limitPriceCents: effectivePriceCents } : {}),
    });
  };

  const handleSubmit = (side: "BUY" | "SELL") => {
    if (qty <= 0) {
      toast.error("Invalid quantity", { description: "Quantity must be greater than 0" });
      return;
    }
    if (orderType === "LIMIT" && effectivePriceCents <= 0) {
      toast.error("Invalid limit price", { description: "Limit price must be greater than 0" });
      return;
    }
    if (side === "BUY" && priceForMaxBaseCents > 0) {
      const estimatedCostBase = Math.round(qty * priceForMaxBaseCents);
      if (estimatedCostBase > Number(buyingPowerCents)) {
        toast.error("Insufficient buying power", {
          description: `Need ${formatCents(estimatedCostBase, userCurrency)} but you have ${formatCents(Number(buyingPowerCents), userCurrency)}`,
        });
        return;
      }
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Compliance gate: if BUY and non-compliant under active framework, require explicit confirmation
    // Even if verdict pending coverage but one rule failed -> already NON_COMPLIANT
    if (side === "BUY" && isNonCompliant && !showComplianceConfirm) {
      setCompliancePendingSide(side);
      setShowComplianceConfirm(true);
      return;
    }
    if (side === "SELL" && qty > heldQty) {
      if (halalBlocksShort) {
        setHalalWarning(true);
        setShowShortConfirm(false);
        return;
      }
      setShowShortConfirm(true);
      setHalalWarning(false);
      return;
    }
    doMutate(side);
  };

  const confirmShortSell = () => {
    setShowShortConfirm(false);
    doMutate("SELL");
  };

  const confirmComplianceBuy = () => {
    const side = compliancePendingSide ?? "BUY";
    setShowComplianceConfirm(false);
    setCompliancePendingSide(null);
    // Re-check short sell guard after compliance confirm (in case it was a sell, though we only gate BUY)
    if (side === "SELL" && qty > heldQty) {
      if (halalBlocksShort) {
        setHalalWarning(true);
        return;
      }
      setShowShortConfirm(true);
      return;
    }
    doMutate(side);
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4 shadow-sm backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Trade</h2>
        {isNonCompliant && activeFrameworkSlug && (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            <ShieldAlert className="h-3 w-3" /> Non-compliant
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-2 rounded-lg bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            orderType === "MARKET"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            orderType === "LIMIT"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Limit
        </button>
      </div>

      <div className="space-y-3">
        {quoteLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : quoteError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Quote unavailable — data not found for this ticker.
          </p>
        ) : (
          <div className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2.5 ring-1 ring-border/50">
            <span className="text-xs text-muted-foreground">{orderType === "MARKET" ? "Market price" : "Last price"}</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {priceCents > 0 ? formatCents(priceCents, currency) : "N/A"}
            </span>
          </div>
        )}

        {orderType === "LIMIT" && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label htmlFor="limit-price" className="text-xs font-medium text-muted-foreground">
              Limit Price ({getCurrencySymbol(currency).trim()})
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="limit-price"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setLimitPrice("");
                    return;
                  }
                  if (!/^[\d.]*$/.test(v)) return;
                  if ((v.match(/\./g) || []).length > 1) return;
                  // strip leading zeros, keep "0." while typing
                  let sanitized = v.replace(/^0+(?=\d)/, "");
                  // limit to 2 decimals while typing
                  if (sanitized.includes(".")) {
                    const [intPart, frac] = sanitized.split(".");
                    if (frac.length > 2) sanitized = `${intPart}.${frac.slice(0, 2)}`;
                  }
                  setLimitPrice(sanitized);
                }}
                onBlur={() => {
                  if (limitPrice === "" || limitPrice === ".") {
                    setLimitPrice("");
                    return;
                  }
                  const n = parseFloat(limitPrice);
                  if (!isNaN(n)) {
                    // normalize trailing zeros: 10.00 -> 10, 10.50 -> 10.5
                    let s = n.toString();
                    // keep at most 2 decimals, strip insignificant zeros
                    if (s.includes(".")) s = s.replace(/\.?0+$/, "");
                    // if typing left "0." normalize to "0"
                    if (s === "") s = "0";
                    setLimitPrice(s);
                  }
                }}
                className="bg-background pl-6 font-mono transition-all focus-visible:ring-emerald/20"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="order-quantity" className="text-xs font-medium text-muted-foreground">
            Quantity
          </label>
          <Input
            id="order-quantity"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setQuantity("");
                return;
              }
              if (!/^[\d.]*$/.test(v)) return;
              if ((v.match(/\./g) || []).length > 1) return;
              let sanitized = v.replace(/^0+(?=\d)/, "");
              // limit fractional to 6 decimals (schema Decimal 15,6)
              if (sanitized.includes(".")) {
                const [intPart, frac] = sanitized.split(".");
                if (frac.length > 6) sanitized = `${intPart}.${frac.slice(0, 6)}`;
              }
              setQuantity(sanitized);
            }}
            onBlur={() => {
              if (quantity === "" || quantity === ".") {
                setQuantity("");
                return;
              }
              const n = parseFloat(quantity);
              if (!isNaN(n)) {
                let s = n.toString();
                // strip trailing zeros after decimal: 10.000000 -> 10, 10.500000 -> 10.5
                if (s.includes(".")) s = s.replace(/\.?0+$/, "");
                if (s === "") s = "0";
                setQuantity(s);
              }
            }}
            className="mt-1.5 bg-background font-mono transition-all focus-visible:ring-emerald/20"
            required
          />
          <div className="mt-1.5 flex gap-1">
            {["1", "10", "100"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setQuantity(v)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  quantity === v ? "bg-emerald-subtle text-emerald" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuantity(String(maxBuyQty > 0 ? maxBuyQty : maxSellQty > 0 ? maxSellQty : 1))}
              disabled={effectivePriceCents <= 0}
              className="ml-auto rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-50"
              title={maxBuyQty > 0 ? `Max buyable with ${formatCents(Number(buyingPowerCents), userCurrency)}` : `Max held: ${maxSellQty}`}
            >
              Max {maxBuyQty > 0 ? `(${maxBuyQty})` : maxSellQty > 0 ? `(${maxSellQty})` : ""}
            </button>
          </div>
          {buyingPowerCents > 0 && effectivePriceCents > 0 && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Buying power: {formatCents(Number(buyingPowerCents), userCurrency)} • Max buy: {maxBuyQty} shares
              {maxSellQty > 0 && ` • Held: ${maxSellQty}`}
            </p>
          )}
        </div>

        {qty > 0 && effectivePriceCents > 0 && (
          <div className="flex items-center justify-between rounded-md bg-emerald-subtle/50 px-3 py-2 ring-1 ring-emerald/10 animate-in fade-in duration-200">
            <span className="text-xs text-muted-foreground">Estimated cost</span>
            <span className="font-mono text-sm font-semibold text-foreground">{formatCents(estimatedCost, currency)}</span>
          </div>
        )}

        {halalWarning && (
          <div className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning/10 px-3 py-2 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-warning">Short selling is not permitted under the Halal (AAOIFI) framework.</p>
          </div>
        )}

        {showShortConfirm && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs leading-relaxed text-muted-foreground">
              You don&apos;t hold any {ticker.toUpperCase()} shares. Are you sure you want to short sell?
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowShortConfirm(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1 bg-destructive text-white hover:bg-red-600 text-xs" onClick={confirmShortSell}>
                Confirm Short Sell
              </Button>
            </div>
          </div>
        )}

        {showComplianceConfirm && complianceReport && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-destructive">Non-compliant under {activeFrameworkName ?? activeFrameworkSlug}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {failedRules.length > 0
                    ? `This asset fails ${failedRules.length} rule${failedRules.length > 1 ? "s" : ""}: ${failedRules.map((r) => r.name).join(", ")}. `
                    : "This asset is marked non-compliant. "}
                  {complianceReport.dataCoverage.withoutData > 0 && (
                    <span className="text-warning">
                      {complianceReport.dataCoverage.withoutData} of {complianceReport.dataCoverage.total} rules had incomplete data.
                    </span>
                  )}
                  Placing a BUY order will increase exposure to a non-compliant asset.
                </p>
                {failedRules.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {failedRules.slice(0, 3).map((r) => (
                      <li key={r.ruleId} className="flex items-center gap-1.5 text-[11px]">
                        <span className="size-1.5 rounded-full bg-destructive" />
                        <span className="font-medium text-foreground">{r.name}:</span>
                        <span className="text-muted-foreground">{r.actualValue} vs {r.thresholdValue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowComplianceConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-destructive text-white hover:bg-red-600 text-xs"
                onClick={confirmComplianceBuy}
              >
                Confirm & Buy
              </Button>
            </div>
          </div>
        )}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in">
            {error instanceof Error ? error.message : typeof error === "string" ? error : "Order failed"}
          </p>
        ) : null}

        {isSuccess &&
          (orderType === "LIMIT" ? (
            <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/10 px-3 py-2 animate-in fade-in slide-in-from-top-1">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <p className="text-xs text-warning">
                Limit order placed — triggers at <span className="font-mono font-medium">{formatCents(effectivePriceCents, currency)}</span>, fills at market price
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-emerald/20 bg-emerald-subtle px-3 py-2 animate-in fade-in slide-in-from-top-1">
              <p className="text-xs font-medium text-emerald">Order executed successfully!</p>
            </div>
          ))}

        <div className="flex gap-2 pt-1">
          <Button
            className="group flex-1 gap-1.5 bg-emerald text-white shadow-sm transition-all hover:bg-emerald-muted hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            disabled={qty <= 0 || isPending || effectivePriceCents <= 0}
            onClick={() => handleSubmit("BUY")}
          >
            {isPending && pendingSide === "BUY" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Buy {ticker.toUpperCase()}
              </>
            )}
          </Button>
          <Button
            className="group flex-1 gap-1.5 bg-destructive text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            disabled={qty <= 0 || isPending || effectivePriceCents <= 0}
            onClick={() => handleSubmit("SELL")}
          >
            {isPending && pendingSide === "SELL" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                Sell {ticker.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        {pendingOrders.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">Active limit orders</p>
              <Badge variant="secondary" className="ml-auto text-[10px]">{pendingOrders.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {pendingOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={o.side === "BUY" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                      {o.side}
                    </Badge>
                    <span className="font-mono text-xs">
                      {o.quantity} @ {o.priceCents != null ? formatCents(o.priceCents, currency) : "--"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelMutate(o.id)}
                    disabled={cancelPending}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {cancelPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AuthInterceptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} ticker={ticker} />
    </div>
  );
}
