export const quoteKeys = {
  detail: (ticker: string) => ["quote", ticker.toUpperCase()] as const,
};

export const complianceKeys = {
  evaluate: (ticker: string, frameworkId?: string, userId?: string) =>
    ["compliance", ticker.toUpperCase(), frameworkId, userId] as const,
};

export const portfolioKeys = {
  detail: () => ["portfolio"] as const,
};

export const frameworkKeys = {
  list: () => ["frameworks"] as const,
};

export const marketDataKeys = {
  candles: (ticker: string, resolution?: string, interval?: string) => {
    const parts = ["market-data", ticker.toUpperCase(), "candles"];
    if (resolution) parts.push(resolution);
    if (interval) parts.push(interval);
    return parts;
  },
  fundamentals: (ticker: string) =>
    ["market-data", ticker.toUpperCase(), "fundamentals"] as const,
  depth: (ticker: string) =>
    ["market-data", ticker.toUpperCase(), "depth"] as const,
};

export const searchKeys = {
  query: (q: string) => ["search", q] as const,
};
