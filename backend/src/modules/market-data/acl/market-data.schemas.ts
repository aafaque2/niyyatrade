import { z } from 'zod';

const SectorEnum = z.enum([
  'Technology',
  'Financials',
  'Energy',
  'Healthcare',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Communication Services',
  'Industrials',
  'Basic Materials',
  'Real Estate',
  'Utilities',
  'Other',
]);

export const MarketQuoteSchema = z.object({
  ticker: z.string().toUpperCase(),
  priceCents: z.number().int().positive(),
  changePercent: z.number(),
  timestamp: z.string().datetime(),
});

export type MarketQuote = z.infer<typeof MarketQuoteSchema>;

export const FinancialFundamentalsSchema = z.object({
  ticker: z.string().toUpperCase(),
  marketCap: z.coerce.number().positive(),
  totalAssets: z.coerce.number().positive(),
  totalDebt: z.preprocess((val) => {
    if (val === 'N/A' || val === '' || val === undefined || val === null)
      return null;
    return val;
  }, z.coerce.number().nullable()),
  cashAndEquivalents: z.coerce.number().nullable(),
  interestIncome: z.coerce.number().nullable(),
  totalRevenue: z.coerce.number(),
  sector: SectorEnum,
  industry: z.string().nullable(),
});

export type FinancialFundamentals = z.infer<typeof FinancialFundamentalsSchema>;

export const ChartCandleSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

export type ChartCandle = z.infer<typeof ChartCandleSchema>;

export const SearchResultSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  sector: z.string().nullable(),
  exchange: z.string().nullable(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
