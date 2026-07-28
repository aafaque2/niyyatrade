"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuote } from "@/lib/hooks/use-quote";
import { useFundamentals } from "@/lib/hooks/use-fundamentals";
import { AssetHeader } from "@/components/asset/asset-header";
import type { MarketQuote } from "@/lib/services/market-data";

const MarketStatusContext = createContext<string | undefined>(undefined);
export function useMarketStatus() {
  return useContext(MarketStatusContext);
}

const QuoteContext = createContext<MarketQuote | undefined>(undefined);
export function useLiveQuote() {
  return useContext(QuoteContext);
}

export function AssetPageClient({
  ticker,
  children,
}: {
  ticker: string;
  children: ReactNode;
}) {
  const [marketStatus, setMarketStatus] = useState<string | undefined>();
  const { data: quote, isLoading: quoteLoading } = useQuote(ticker, {
    marketStatus,
  });
  const { data: fundamentals, isLoading: fundamentalsLoading } =
    useFundamentals(ticker);

  if (quote?.marketStatus && quote.marketStatus !== marketStatus) {
    setMarketStatus(quote.marketStatus);
  }

  return (
    <MarketStatusContext.Provider value={quote?.marketStatus}>
      <QuoteContext.Provider value={quote}>
        <AssetHeader
          ticker={ticker}
          companyName={fundamentals?.industry ?? undefined}
          priceCents={quote?.priceCents}
          changePercent={quote?.changePercent}
          currency={quote?.currency}
          marketStatus={quote?.marketStatus}
          isLoading={quoteLoading}
        />

        {children}
      </QuoteContext.Provider>
    </MarketStatusContext.Provider>
  );
}
