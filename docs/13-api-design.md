# 13 — API Design

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Backend Engineering
> **Audience:** Frontend Engineers, Backend Engineers, QA
> **Depends On:** `09-domain-models.md`, `11-backend-architecture.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [API Standards & Conventions](#5-api-standards--conventions)
6. [Standard Payload Formats](#6-standard-payload-formats)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Identity & Users API](#8-identity--users-api)
9. [Trading & Portfolio API](#9-trading--portfolio-api)
10. [Compliance Framework API](#10-compliance-framework-api)
11. [Market Data API](#11-market-data-api)
12. [Rate Limiting & Pagination](#12-rate-limiting--pagination)
13. [Tradeoffs](#13-tradeoffs)
14. [Risks](#14-risks)
15. [Future Expansion](#15-future-expansion)
16. [Dependencies](#16-dependencies)
17. [Engineering Notes](#17-engineering-notes)
18. [Recruiter Impact Notes](#18-recruiter-impact-notes)
19. [Business Impact Notes](#19-business-impact-notes)
20. [Document Cross-References](#20-document-cross-references)

---

## 1. Purpose

This document defines the RESTful HTTP interfaces that connect the Next.js frontend to the NestJS backend. A well-designed API is a contract. By defining this contract early, frontend and backend teams can work completely in parallel. The frontend can mock these exact responses, and the backend can write tests against these exact structures.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| AD-1 | Establish a Predictable Contract | 100% of API responses follow the standard Envelope format (`{ data, error, meta }`). |
| AD-2 | Protect Financial Math | All currency values must be transmitted as Integers (cents). |
| AD-3 | Enable Frontend Caching | Every GET request includes proper `ETag` or `Cache-Control` headers for TanStack Query optimization. |
| AD-4 | Decouple Trading from Compliance | API namespaces strictly map to the bounded contexts defined in `09-domain-models.md`. |

---

## 3. Scope

### 3.1 In Scope
- API conventions (REST, HTTP methods, Status Codes).
- Standardized response envelopes (Success/Error).
- Detailed definitions of P0/P1 endpoints for the MVP.
- Rate limiting and pagination strategies.

### 3.2 Out of Scope
- GraphQL schemas (HalalTrade MVP uses REST).
- WebSocket streaming specs (Covered in Phase 3 expansions).
- Internal microservice-to-microservice gRPC contracts (Not applicable; using a Modular Monolith).

---

## 4. Executive Summary

The HalalTrade API is a Level 2 RESTful JSON API. 
It operates under the `/api/v1/` prefix. 

The API strictly adheres to resource-based routing (e.g., `POST /portfolios/{id}/orders`) and leverages standard HTTP verbs and status codes for predictable error handling. The most complex and critical endpoint in the system is `GET /compliance/evaluate`, which dynamically runs the Compliance Framework Engine and outputs a highly structured, framework-agnostic JSON report.

All timestamps are ISO 8601, and all monetary values are passed as integers representing the smallest currency unit (cents).

---

## 5. API Standards & Conventions

### 5.1 HTTP Methods
- `GET`: Retrieve a resource (Idempotent).
- `POST`: Create a new resource or execute an action (e.g., placing an order).
- `PUT`: Completely replace a resource (e.g., updating framework preferences).
- `PATCH`: Partially update a resource.
- `DELETE`: Remove a resource.

### 5.2 HTTP Status Codes
- `200 OK`: Standard success.
- `201 Created`: Resource successfully created (e.g., Order placed).
- `202 Accepted`: Request accepted but processing asynchronously (e.g., Portfolio Re-evaluation triggered).
- `400 Bad Request`: Client error, validation failed (e.g., Insufficient funds).
- `401 Unauthorized`: Missing or invalid Auth token.
- `403 Forbidden`: Authenticated, but lacks permissions for this resource.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: An unhandled backend crash.

---

## 6. Standard Payload Formats

To ensure the frontend doesn't need custom parsing logic for every endpoint, all responses are wrapped in a standard envelope.

### 6.1 Success Response
```json
{
  "data": { ... }, // The actual resource payload
  "meta": {
    "timestamp": "2026-06-25T12:00:00Z",
    "pagination": { ... } // Optional
  }
}
```

### 6.2 Error Response
The error format provides a human-readable message for the UI and an internal code for logic handling.
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "You do not have enough buying power to execute this trade.",
    "details": {
      "available": 15000,
      "required": 25000
    }
  },
  "meta": {
    "timestamp": "2026-06-25T12:00:05Z",
    "requestId": "req_12345abcde" // Critical for tracing logs
  }
}
```

---

## 7. Authentication & Authorization

- **Method:** Bearer Token (JWT).
- **Header:** `Authorization: Bearer <token>`
- **Scope:** The MVP does not utilize complex RBAC (Role-Based Access Control) for users. If a user owns a resource (verified via JWT `sub` claim vs DB `user_id`), they can mutate it.

---

## 8. Identity & Users API

### 8.1 `GET /users/me`
Retrieves the authenticated user's profile and core settings.
- **Response:**
  ```json
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "activeFrameworkId": "uuid"
  }
  ```

### 8.2 `PUT /users/me/framework-prefs`
Updates the user's custom compliance thresholds.
- **Request Body:**
  ```json
  {
    "frameworkId": "uuid",
    "overrides": {
      "debt_to_equity": 30.00
    }
  }
  ```
- **Response:** `202 Accepted` (Triggers background portfolio re-evaluation).

---

## 9. Trading & Portfolio API

### 9.1 `GET /portfolio`
Retrieves the user's virtual portfolio, balances, and holdings.
- **Query Params:** `?includeCompliance=true` (If true, the backend calls the Compliance module to append the current verdict to each holding).
- **Response:**
  ```json
  "data": {
    "id": "uuid",
    "buyingPowerCents": 5400000,
    "totalValueCents": 12500000,
    "overallComplianceScore": 100,
    "positions": [
      {
        "ticker": "AAPL",
        "quantity": 15.5,
        "avgPriceCents": 15000,
        "currentPriceCents": 17500,
        "complianceVerdict": "COMPLIANT"
      }
    ]
  }
  ```

### 9.2 `POST /portfolio/orders`
Submits a new paper trade.
- **Request Body:**
  ```json
  {
    "ticker": "AAPL",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 5.0
  }
  ```
- **Response:** `201 Created`
  ```json
  "data": {
    "orderId": "uuid",
    "status": "EXECUTED",
    "executedPriceCents": 17500
  }
  ```

---

## 10. Compliance Framework API

This is the core IP of the platform.

### 10.1 `GET /compliance/evaluate`
Dynamically evaluates a specific asset against a framework.
- **Query Params:** 
  - `ticker` (Required)
  - `frameworkId` (Optional, defaults to user's active framework)
- **Response:** (This matches the contract defined in `09-domain-models.md`)
  ```json
  "data": {
    "assetId": "AAPL",
    "frameworkId": "uuid",
    "verdict": "COMPLIANT",
    "rules": [
      {
        "ruleId": "debt_to_equity",
        "name": "Debt-to-Equity",
        "passed": true,
        "actualValue": "31.5%",
        "thresholdValue": "< 33%",
        "explanation": "Total debt of $110B divided by total equity of $350B is 31.5%..."
      }
    ]
  }
  ```

### 10.2 `GET /frameworks`
Lists available compliance frameworks for the user to choose from.
- **Response:** Array of framework summaries (Halal AAOIFI, ESG Strict, etc.).

---

## 11. Market Data API

*Note: The frontend must never call third-party APIs (like Polygon) directly. It must always call our internal API to ensure the Anti-Corruption Layer sanitizes the data and to prevent exposing third-party API keys.*

### 11.1 `GET /market-data/{ticker}/quote`
Retrieves the real-time (or 15-min delayed) price.
- **Response:**
  ```json
  "data": {
    "ticker": "AAPL",
    "priceCents": 17500,
    "changePercent": 1.25,
    "timestamp": "2026-06-25T12:00:00Z"
  }
  ```

### 11.2 `GET /market-data/{ticker}/candles`
Retrieves historical price data for charting.
- **Query Params:** `resolution` (1D, 1W), `from`, `to`
- **Response:** Array of `[timestamp, open, high, low, close, volume]`.

---

## 12. Rate Limiting & Pagination

### 12.1 Rate Limiting
Financial APIs are prone to aggressive scraping or buggy frontend polling loops.
- **Global Limit:** 100 requests per IP per minute.
- **Market Data Limit:** 30 requests per IP per minute (Protects our third-party API bills).
- **Headers:** All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

### 12.2 Pagination
For endpoints returning arrays (e.g., `/history/orders`), cursor-based pagination is used to prevent layout shifts and handle rapidly updating data better than offset/limit pagination.
- **Query Params:** `?cursor=xyz123&limit=20`

---

## 13. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **API Style** | RESTful JSON | GraphQL | While GraphQL is excellent for preventing over-fetching, it adds immense backend complexity and makes HTTP-level caching (CDN/Redis) very difficult. Our data structures are fixed enough that REST is faster to build and easier to cache. |
| **Number Format** | Integers (Cents) | Floats | Returning `175.50` is easier for the frontend to read, but risks Javascript float parsing errors. Passing `17550` guarantees perfect accuracy at the cost of a `/100` operation on the client. |
| **Portfolio Compliance** | Merged in `GET /portfolio` | Separate API calls | We allow `?includeCompliance=true` to merge compliance verdicts into the portfolio holding list. This slightly breaks REST purity but saves the frontend from making 15 parallel API calls when viewing a portfolio. |

---

## 14. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Endpoint Polling Abuse** | High | The frontend polling `/market-data/quote` every 1 second will crash the server and burn API credits. **Mitigation:** Strict Rate Limiting (429s) and TanStack Query configuration enforcing minimum stale times. |
| **Over-fetching Fundamentals** | Medium | Returning the entire Balance Sheet to the frontend when it only needs the Compliance Verdict. **Mitigation:** The `GET /compliance/evaluate` endpoint *only* returns the formatted explanation strings, not the raw Q3 10-K JSON payload. |

---

## 15. Future Expansion

| Feature | API Impact | Phase |
|---|---|---|
| **WebSockets** | Introduce `wss://api.halaltrade.com/v1/stream` for live portfolio PnL and ticker updates, deprecating heavy HTTP polling. | Phase 3 |
| **Public API Keys** | Allow users (e.g., Institutional Quants) to generate API keys to programmatically call `GET /compliance/evaluate` for their own tools. | Phase 5 |

---

## 16. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Zod / Class-Validator** | Technical | Ensures that incoming POST/PUT request bodies strictly match the expected types before hitting the NestJS controllers. |
| **NestJS Throttler** | Technical | Handles the Redis-backed rate limiting specified in Section 12. |

---

## 17. Engineering Notes

- **Idempotency:** The `POST /portfolio/orders` endpoint should eventually support an `Idempotency-Key` header. If the user's internet cuts out and they click "Buy" twice, the API should recognize the duplicate key and not charge them twice.
- **Response Compression:** The NestJS API must implement GZIP/Brotli compression, as arrays of historical chart candles can become massive JSON payloads.

---

## 18. Recruiter Impact Notes

### 18.1 What This Document Demonstrates
- **API Design Maturity:** Utilizing standard Error Envelopes with unique `requestIds` demonstrates an understanding of production observability and debugging at scale.
- **Defensive API Contracts:** Passing money as integers and returning strings for percentages (e.g., `"31.5%"`) rather than floats proves domain knowledge in financial software engineering.
- **Frontend Empathy:** Recognizing that making the frontend do 15 API calls to get a portfolio's compliance status is bad UX, and deliberately designing a `?includeCompliance=true` query param to solve it via backend orchestration.

---

## 19. Business Impact Notes

- **Third-Party API Cost Savings:** By forcing the frontend to call our internal `/market-data` API rather than calling Polygon directly, we can aggressively cache the results in Redis. 1,000 users checking AAPL only costs us 1 API credit instead of 1,000.
- **B2B Revenue Potential:** The `GET /compliance/evaluate` contract is so cleanly abstracted that it can easily be packaged and sold as a standalone B2B API product to other brokerages looking to add "Halal Screening" to their apps.

---

## 20. Document Cross-References

| Document | Relationship |
|---|---|
| `09-domain-models.md` | The JSON structures here reflect the Entities and Value Objects defined in the Domain Models. |
| `11-backend-architecture.md` | Defines the NestJS controllers and services that will implement these exact routes. |
| `12-frontend-architecture.md` | TanStack query uses these exact routes for its data fetching and caching keys. |

---

> **End of Document**
>
> Any breaking changes to these response envelopes must be coordinated with Frontend Engineering to ensure TanStack Query types and Zod schemas are updated simultaneously.
