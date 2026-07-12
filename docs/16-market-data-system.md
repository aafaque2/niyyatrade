# 16 — Market Data System

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Backend Engineering / Data Pipelines
> **Audience:** Backend Engineers, Product Managers
> **Depends On:** `09-domain-models.md`, `11-backend-architecture.md`

*(Note: Filename was corrected from `systm` to `system` to maintain alignment with the Master Context).*

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Vendor Strategy & Cost Control](#5-vendor-strategy--cost-control)
6. [The Anti-Corruption Layer (ACL)](#6-the-anti-corruption-layer-acl)
7. [Zod Validation Schema](#7-zod-validation-schema)
8. [Data Types & Caching Strategy](#8-data-types--caching-strategy)
9. [Graceful Degradation & Fallbacks](#9-graceful-degradation--fallbacks)
10. [Tradeoffs](#10-tradeoffs)
11. [Risks](#11-risks)
12. [Future Expansion](#12-future-expansion)
13. [Dependencies](#13-dependencies)
14. [Engineering Notes](#14-engineering-notes)
15. [Recruiter Impact Notes](#15-recruiter-impact-notes)
16. [Business Impact Notes](#16-business-impact-notes)
17. [Document Cross-References](#17-document-cross-references)

---

## 1. Purpose

This document outlines the architecture of the Market Data System. 
The Compliance Framework Engine (`14-compliance-engine.md`) and the Paper Trading Engine (`15-paper-trading-engine.md`) are both entirely dependent on external financial data (Prices, Balance Sheets, Income Statements). If this data is flawed, missing, or improperly formatted, the core value proposition of HalalTrade collapses. This document defines how we ingest, sanitize, and cache this volatile external data safely.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| MD-1 | Prevent Upstream Pollution | The core backend must never see raw JSON from third-party APIs. All data must pass through strict Zod validation. |
| MD-2 | Minimize API Costs | Ensure redundant calls for the same asset are served from Redis, reducing upstream API bills by >90%. |
| MD-3 | Handle Missing Data Safely | Ensure missing financial metrics (e.g., a missing debt figure) are cast as `null`, never `0`, to prevent false compliance passes. |
| MD-4 | Standardize Sectors | Map proprietary vendor sectors (e.g., "Tech" vs "Technology") into a standardized internal enum for reliable filtering. |

---

## 3. Scope

### 3.1 In Scope
- The Anti-Corruption Layer (ACL) pattern.
- Caching TTLs (Time-to-Live) for different classes of financial data.
- Zod schema validation rules.
- Vendor abstraction strategies (Dependency Injection).

### 3.2 Out of Scope
- Detailed price comparisons of specific vendors (e.g., Polygon vs FMP pricing sheets).
- Ingestion pipelines for raw SEC 10-K filings (We rely on aggregators, not raw scraping, for the MVP).

---

## 4. Executive Summary

The Market Data System acts as the platform's shield. Financial API providers frequently change their JSON structures, experience downtime, or return inconsistent data types (e.g., returning the string `"N/A"` instead of a `null` value).

To combat this, the system implements an **Anti-Corruption Layer (ACL)** using **Zod**. Every API response from a vendor is validated and mapped into strict, internal TypeScript Data Transfer Objects (DTOs). If validation fails, the system logs an alert and serves the last known good data from **Redis**. 

By abstracting the specific vendor (e.g., using an `IMarketDataProvider` interface), the platform can seamlessly swap from Provider A to Provider B if costs rise, without altering a single line of the Compliance Engine code.

---

## 5. Vendor Strategy & Cost Control

### 5.1 Vendor Abstraction
The backend utilizes the Dependency Injection (DI) container in NestJS to load the market data provider. 

```typescript
// Core Engine calls this Interface, never the specific vendor
export interface IMarketDataProvider {
  getQuote(ticker: string): Promise<MarketQuote>;
  getFundamentals(ticker: string): Promise<FinancialFundamentals>;
  getCandles(ticker: string, range: string): Promise<ChartCandle[]>;
}
```

### 5.2 Delayed vs. Real-Time Data
- **Real-Time Data** requires paying expensive exchange fees (e.g., NASDAQ/NYSE SIP fees) per user, which is unviable for a free MVP.
- **Decision:** The MVP utilizes **15-Minute Delayed** data or End-of-Day (EOD) data. Halal investing is about long-term philosophy, not millisecond day trading. Delayed data serves the user's needs perfectly while saving thousands of dollars in licensing fees.

---

## 6. The Anti-Corruption Layer (ACL)

The ACL ensures that the unpredictable chaos of external APIs does not pollute the clean internal Domain Models.

### The Pipeline
1. `MarketDataModule` requests AAPL fundamentals from the Vendor API.
2. Vendor returns JSON.
3. **Sanitization:** The ACL strips out unneeded fields (e.g., `ceo_name`, `headquarters_address`).
4. **Validation:** The ACL passes the JSON through a Zod schema.
5. **Normalization:** It converts strings to numbers, handles `nulls`, and standardizes the Sector name.
6. **Delivery:** It returns the clean `FinancialFundamentals` object to the Compliance Engine.

---

## 7. Zod Validation Schema

To protect the Compliance Engine's math, the input data must be heavily typed.

```typescript
import { z } from 'zod';

export const FinancialFundamentalsSchema = z.object({
  ticker: z.string().toUpperCase(),
  
  // Coerce converts strings like "150000.50" to numbers safely
  marketCap: z.coerce.number().positive(),
  totalAssets: z.coerce.number().positive(),
  
  // Debt can theoretically be 0, but if it's "N/A" or missing, it must be null.
  totalDebt: z.preprocess((val) => {
    if (val === 'N/A' || val === '' || val === undefined) return null;
    return val;
  }, z.coerce.number().nullable()),

  interestIncome: z.coerce.number().nullable(),
  totalRevenue: z.coerce.number(),

  // Standardize sectors to internal enums
  sector: z.enum(['Technology', 'Financials', 'Energy', 'Healthcare', 'Other']),
});

// The generated TypeScript type used by the rest of the application
export type FinancialFundamentals = z.infer<typeof FinancialFundamentalsSchema>;
```

---

## 8. Data Types & Caching Strategy

Not all financial data updates at the same frequency. We utilize distinct Redis TTLs (Time-to-Live) to minimize API calls while maintaining data accuracy.

| Data Type | Definition | Refresh Frequency | Redis TTL | Rationale |
|---|---|---|---|---|
| **Market Quotes** | Current Price, Daily Change, Volume | High | 1 Minute | Prices change constantly. Polling every second is too expensive. A 1-minute cache provides a realistic "delayed" feel. |
| **Chart Candles** | Historical Open/High/Low/Close data | Medium | 1 Hour (for intraday), 24 Hours (for 1Y charts) | Historical data doesn't change once the day is closed. |
| **Fundamentals** | Balance Sheet, Income Statement (Debt, Revenue) | Low | 24 Hours | Companies only report earnings 4 times a year. Caching this for 24 hours eliminates 99.9% of API calls to the fundamentals endpoint. |
| **Asset Master** | Ticker lists, Names, Sectors | Very Low | 7 Days | Apple's sector and name rarely change. |

---

## 9. Graceful Degradation & Fallbacks

External APIs go down. When they do, the platform must not crash.

### 9.1 The "Stale Cache" Fallback
If the Redis cache for AAPL fundamentals expires, the system attempts to fetch fresh data from the Vendor API.
If the Vendor API returns a `500 Internal Server Error`:
1. The ACL intercepts the error.
2. It logs a high-priority alert.
3. Instead of crashing, it queries Redis for the *stale* (expired) data.
4. It serves the stale data to the Compliance Engine to ensure the user can still view the asset.

### 9.2 The `INSUFFICIENT_DATA` Failsafe
As noted in `14-compliance-engine.md`, if the API successfully returns data, but critical fields (like `totalDebt`) are genuinely missing, the ACL maps them to `null`. The Compliance Engine is designed to interpret `null` inputs as an immediate `INSUFFICIENT_DATA` status, protecting the user from false positives.

---

## 10. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Data Normalization** | Internal (Zod/TypeScript) | External (DB ETL Pipeline) | Maintaining a massive database of normalized financial data for 10,000+ stocks requires a dedicated Data Engineering team. Fetching, normalizing on the fly, and caching in Redis is lean, fast, and sufficient for the MVP. |
| **Sector Mapping** | Hardcoded Enum | Dynamic Strings | If we accept any string a vendor sends (e.g., "Software - Infrastructure" vs "Tech"), writing compliance rules to ban specific sectors becomes impossible. Forcing incoming sectors into a rigid Enum simplifies the compliance logic massively. |

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Vendor Rate Limits** | High | If 100 users search for a new micro-cap stock simultaneously, we might hit the vendor's 30-requests-per-second limit before Redis caches the result. **Mitigation:** Implement request coalescing. If 10 requests for AAPL hit the ACL simultaneously, it only fires 1 external API call and distributes the result to all 10 waiting threads. |
| **Silent API Changes** | High | A vendor changes the JSON key from `interestIncome` to `interest_income`. **Mitigation:** The Zod schema will immediately fail to parse it. The system will serve stale data and trigger a PagerDuty alert to the engineering team. |

---

## 12. Future Expansion

| Feature | System Impact | Phase |
|---|---|---|
| **Multi-Vendor Fallbacks** | If Vendor A goes down, the ACL automatically attempts to fetch the data from Vendor B, mapping it to the same internal DTO. | Phase 3 |
| **Real-Time Data Gateway** | Introducing a WebSocket server to stream real-time price ticks to the frontend, bypassing the 1-minute Redis cache. | Phase 4 |

---

## 13. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Zod** | Library | The backbone of the ACL. Required for parsing and coercing external JSON safely. |
| **Redis** | Infrastructure | The entire cost-saving strategy relies on Redis functioning correctly. |
| **Financial API Vendor** | Third-Party | e.g., Financial Modeling Prep (FMP) or Polygon.io. |

---

## 14. Engineering Notes

- **Request Coalescing (Thundering Herd Protection):** Use a `Promise` caching mechanism in the fetching service. If `fetchQuote('AAPL')` is called while a promise for AAPL is already pending, return the existing promise rather than initiating a second HTTP request.
- **Never Log Raw Payloads:** Vendor APIs sometimes return proprietary or sensitive data headers. When logging validation failures, log the Zod error and the ticker, but do not dump the massive raw JSON payload into the logs to save log ingestion costs.

---

## 15. Recruiter Impact Notes

### 15.1 What This Document Demonstrates
- **Defensive Programming:** The entire premise of this document is "Don't trust external data." Building an Anti-Corruption Layer with Zod proves an understanding of how production systems actually break.
- **Cost-Aware Engineering:** Recognizing that pulling real-time fundamentals on every page load will bankrupt a startup, and explicitly designing a tiered caching strategy (1 min vs 24h) to optimize the cloud bill.
- **System Resilience:** The "Stale Cache" fallback strategy demonstrates an understanding of high availability—it's better to show yesterday's accurate balance sheet than to show a 500 Server Error today.

---

## 16. Business Impact Notes

- **Vendor Portability:** By forcing all external data to conform to an internal interface, the business isn't locked into a specific data provider. If a vendor raises their prices by 300%, the engineering team can swap to a cheaper provider in days, not months.
- **Data Cost Minimization:** The heavy reliance on Redis caching and 15-minute delayed data ensures that infrastructure and API costs remain flat, even if user traffic spikes 10x due to a viral marketing campaign.

---

## 17. Document Cross-References

| Document | Relationship |
|---|---|
| `14-compliance-engine.md` | The engine is the primary consumer of the sanitized `FinancialFundamentals` object produced by this system. |
| `11-backend-architecture.md` | Defines the broader NestJS monolithic architecture where this module resides. |
| `09-domain-models.md` | Provides the conceptual definition of the Market Data bounded context. |

---

> **End of Document**
>
> Any changes to the `FinancialFundamentalsSchema` must be coordinated with the `Compliance Framework Engine` team to ensure existing rule mathematics are not broken.
