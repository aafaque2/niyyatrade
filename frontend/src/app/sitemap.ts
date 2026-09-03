import type { MetadataRoute } from "next";

// Fixed build-time date: `new Date()` on every request breaks 304/ETag caching.
const BUILD_DATE = new Date("2026-09-03T00:00:00Z");

// Popular assets indexed for SEO ("Is X Halal?" landing pages).
const FEATURED_TICKERS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "NVDA",
  "TSLA",
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "TATAMOTORS.NS",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://niyyatrade.com";

  return [
    { url: baseUrl, lastModified: BUILD_DATE, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/markets`, lastModified: BUILD_DATE, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/frameworks`, lastModified: BUILD_DATE, changeFrequency: "weekly", priority: 0.7 },
    ...FEATURED_TICKERS.map((t) => ({
      url: `${baseUrl}/assets/${t}`,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${baseUrl}/terms`, lastModified: BUILD_DATE, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: BUILD_DATE, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/login`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.3 },
  ];
}
