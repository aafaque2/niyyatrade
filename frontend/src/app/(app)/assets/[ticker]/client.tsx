"use client";

import type { ReactNode } from "react";
import { useQuote } from "@/lib/hooks/use-quote";
import { useFundamentals } from "@/lib/hooks/use-fundamentals";
import { AssetHeader } from "@/components/asset/asset-header";

export function AssetPageClient({
  ticker,
  children,
}: {
  ticker: string;
  children: ReactNode;
}) {
  const { data: quote, isLoading: quoteLoading } = useQuote(ticker);
  const { data: fundamentals, isLoading: fundamentalsLoading } =
    useFundamentals(ticker);

  return (
    <>
      <AssetHeader
        ticker={ticker}
        companyName={fundamentals?.industry ?? undefined}
        priceCents={quote?.priceCents}
        changePercent={quote?.changePercent}
        currency={quote?.currency}
        isLoading={quoteLoading}
      />

      {children}
    </>
  );
}
