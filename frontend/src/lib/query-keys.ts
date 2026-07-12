export const quoteKeys = {
  detail: (ticker: string) => ["quote", ticker.toUpperCase()] as const,
};

export const complianceKeys = {
  evaluate: (ticker: string, frameworkId?: string) =>
    ["compliance", ticker.toUpperCase(), frameworkId] as const,
};

export const portfolioKeys = {
  detail: () => ["portfolio"] as const,
};

export const frameworkKeys = {
  list: () => ["frameworks"] as const,
};

export const marketDataKeys = {
  candles: (ticker: string, resolution?: string) =>
    ["market-data", ticker.toUpperCase(), "candles", resolution] as const,
};

export const searchKeys = {
  query: (q: string) => ["search", q] as const,
};
