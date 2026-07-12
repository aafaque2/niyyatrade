# 18 — Observability

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** DevOps / Backend Engineering
> **Audience:** Backend Engineers, DevOps, Site Reliability Engineers (SRE)
> **Depends On:** `11-backend-architecture.md`, `16-market-data-system.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Logging Strategy (Structured JSON)](#5-logging-strategy-structured-json)
6. [Distributed Tracing (Request IDs)](#6-distributed-tracing-request-ids)
7. [Error Tracking (Sentry)](#7-error-tracking-sentry)
8. [Metrics & Dashboards](#8-metrics--dashboards)
9. [Alerting & Incident Response](#9-alerting--incident-response)
10. [Audit Logging (Compliance Integrity)](#10-audit-logging-compliance-integrity)
11. [Tradeoffs](#11-tradeoffs)
12. [Risks](#12-risks)
13. [Future Expansion](#13-future-expansion)
14. [Dependencies](#14-dependencies)
15. [Engineering Notes](#15-engineering-notes)
16. [Recruiter Impact Notes](#16-recruiter-impact-notes)
17. [Business Impact Notes](#17-business-impact-notes)
18. [Document Cross-References](#18-document-cross-references)

---

## 1. Purpose

This document outlines how HalalTrade monitors its own health. When a user reports that "Apple is showing as non-compliant, but it shouldn't be," or an API goes down at 9:30 AM on a Monday, the engineering team cannot rely on `console.log` and guesswork. 

Observability—comprising Logs, Metrics, and Traces—provides the x-ray vision necessary to debug a complex, highly distributed financial engine operating across asynchronous queues and third-party APIs.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| OB-1 | Zero Blind Spots | Every API request, background job, and external API call must be traceable via a unique `requestId`. |
| OB-2 | Actionable Alerts | No alert fatigue. PagerDuty only fires if the system is failing, not if a single user inputs a bad password. |
| OB-3 | Protect PII | Logs must be automatically sanitized to never include passwords, auth tokens, or exact portfolio dollar amounts. |
| OB-4 | Compliance Auditing | Every change to a Framework's JSONB rule configuration must leave an immutable audit trail. |

---

## 3. Scope

### 3.1 In Scope
- Centralized logging formatting and tooling.
- Distributed tracing through the Monolith and BullMQ.
- Exception tracking for Frontend (Next.js) and Backend (NestJS).
- Key Performance Indicators (KPIs) for system health metrics.
- PagerDuty routing strategies.

### 3.2 Out of Scope
- Granular setup of specific DataDog/Prometheus YAML configs (Reserved for deployment playbooks).
- Client-side product analytics (e.g., Mixpanel tracking of which buttons get clicked).

---

## 4. Executive Summary

HalalTrade utilizes a modern, unified observability stack. 

The application outputs strictly structured JSON logs (via `pino`) injected with a `requestId`. This `requestId` is passed from the Next.js frontend, through the NestJS API, and into any asynchronous BullMQ jobs. 

Exceptions are caught globally and piped to **Sentry** with full stack traces and contextual metadata. System health (CPU, Memory, Redis Queue Depth, External API latency) is exported as metrics to a time-series database. When critical thresholds are breached (e.g., "The Market Data API has failed 5 times in 60 seconds"), the system automatically pages the on-call engineer.

---

## 5. Logging Strategy (Structured JSON)

Human-readable terminal logs are useless in a cloud environment. We log strictly in JSON so that log aggregators (like DataDog, AWS CloudWatch, or ELK) can index and query the data.

### 5.1 The Standard Log Format
Every log entry must contain the following keys:
```json
{
  "level": "info",
  "timestamp": "2026-06-25T09:30:05.123Z",
  "requestId": "req_abc123",
  "context": "MarketDataModule",
  "message": "Successfully fetched quote for AAPL",
  "metadata": {
    "ticker": "AAPL",
    "latencyMs": 142,
    "source": "cache" 
  }
}
```

### 5.2 Log Levels
- **`ERROR`**: The system failed to complete a requested action (e.g., DB connection dropped). PagerDuty alert.
- **`WARN`**: An unexpected issue occurred, but the system recovered (e.g., External API failed, but we successfully served stale Redis data).
- **`INFO`**: Significant state changes (e.g., Order executed, User registered).
- **`DEBUG`**: Deep execution details (e.g., The raw math output of a specific rule). Disabled in Production.

---

## 6. Distributed Tracing (Request IDs)

Because a single user action (placing a market order at night) might span an HTTP request, a Redis cache lookup, a 12-hour wait, and a BullMQ background job execution, tracing is critical.

### 6.1 The `X-Request-ID` Flow
1. **Frontend:** The Next.js client generates a UUID and attaches it to the `X-Request-ID` header of the fetch call.
2. **Backend API:** NestJS middleware extracts the header and attaches it to an asynchronous context (e.g., `AsyncLocalStorage`).
3. **Logging:** Every `logger.info()` automatically pulls the ID from the async context and appends it to the JSON log.
4. **Queues:** If the request spawns a BullMQ job, the `requestId` is passed in the job payload. When the worker picks up the job hours later, it injects that same ID into its async context.

**Result:** A developer can search `req_abc123` in DataDog and see the initial API call, the 12-hour delay, and the final order execution log, all perfectly linked.

---

## 7. Error Tracking (Sentry)

Logs are for searching; Error Trackers are for triaging. We use **Sentry** (or equivalent) for global exception handling.

### 7.1 Frontend (Next.js)
- Unhandled React rendering errors trigger the Next.js `error.tsx` boundary and fire an event to Sentry.
- Includes browser context (OS, Browser version, Screen size) and the active Next.js route.

### 7.2 Backend (NestJS)
- A global `ExceptionFilter` catches any unhandled 500 errors.
- **Sanitization:** Before sending the request payload to Sentry, the filter scrubs all fields matching `password`, `token`, `authorization`, and `cash_balance`.

---

## 8. Metrics & Dashboards

Metrics track the volume and performance of the system over time. 

### 8.1 Critical Backend Metrics (The "Golden Signals")
1. **Latency:** Average and P99 response times for `/compliance/evaluate`. (Target: < 500ms).
2. **Traffic:** Number of API requests per minute.
3. **Error Rate:** Percentage of HTTP 5xx responses.
4. **Saturation:** BullMQ queue depth (e.g., "Are there 5,000 pending orders waiting to execute?").

### 8.2 Business & Domain Metrics
- **Cache Hit Ratio:** Percentage of Market Data requests served by Redis vs. the external API provider. (Target: > 90%).
- **Rule Failure Rates:** Which compliance rules trigger the most "Non-Compliant" statuses? (Useful for product analytics).

---

## 9. Alerting & Incident Response

Alerts must be highly tuned to prevent "Alert Fatigue," where engineers ignore pages because the system cries wolf too often.

### 9.1 PagerDuty Routing (Critical / P0)
These alerts page the on-call engineer, waking them up at 3 AM.
- **Market Data API Failure:** 10 consecutive connection failures to our upstream vendor. (The engine is blind).
- **Database CPU > 90%:** Sustained for more than 5 minutes.
- **High 5xx Rate:** > 5% of all API requests failing over a 2-minute window.
- **Dead Letters:** BullMQ jobs failing repeatedly and moving to the Dead Letter Queue (DLQ).

### 9.2 Slack Routing (Warning / P1)
These alerts send a message to a `#dev-alerts` Slack channel for next-day review.
- **Cache Hit Ratio Drop:** Drops below 70% (We are burning API credits).
- **Stale Data Fallback:** The system successfully served stale Redis data because the upstream API timed out once.

---

## 10. Audit Logging (Compliance Integrity)

Because the Compliance Engine is the ethical core of the platform, any changes to its logic must be treated like changes to a financial ledger.

- **Trigger:** An Admin uses the internal dashboard to update the AAOIFI Framework JSONB (e.g., changing the debt divisor from Market Cap to Total Assets).
- **Action:** Before the database transaction commits, a row is written to an immutable `audit_logs` table.
- **Payload:** Records the Admin's `userId`, the `timestamp`, the `before_state` JSON, and the `after_state` JSON.
- **Why:** If users complain that "AAPL was compliant yesterday but isn't today," the engineering team can query the audit log to prove exactly when and why the underlying algorithmic rules changed.

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Tracing Tooling** | Manual Request IDs | OpenTelemetry Auto-Instrumentation | OpenTelemetry is the gold standard but is notoriously complex to set up in a Node.js/Prisma environment for a startup. Manually passing a UUID through headers and AsyncLocalStorage achieves 90% of the value with 10% of the effort for an MVP. |
| **Log Storage** | Cloud Provider (DataDog/AWS) | Self-Hosted ELK Stack | Managing an ElasticSearch cluster requires dedicated DevOps time. Paying a SaaS provider for log aggregation is worth the initial cost to free up engineering resources. |

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **PII / Financial Data Leak in Logs** | High | A developer logs the full `User` object, dumping emails and exact portfolio balances into DataDog. **Mitigation:** Configure the `pino` logger to automatically redact specific JSON keys (`email`, `password`, `available_cash`) before standard output. |
| **Log Volume Cost Spikes** | Medium | The `/market-data/quote` endpoint is called 100 times a second, generating 50GB of logs a day and resulting in a $5,000 DataDog bill. **Mitigation:** Use log sampling. Only log 10% of successful `GET` requests, but log 100% of errors and state mutations (`POST`, `PUT`). |

---

## 13. Future Expansion

| Feature | Observability Impact | Phase |
|---|---|---|
| **Full OpenTelemetry** | Replace manual `X-Request-ID` passing with standard OpenTelemetry libraries to automatically generate waterfall trace graphs in Jaeger or DataDog APM. | Phase 3 |
| **SOC2 Compliance** | Ensure that audit logs are exported to cold storage (e.g., AWS S3 Glacier) with WORM (Write Once, Read Many) protection to prevent tampering by internal employees. | Phase 4 |

---

## 14. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Pino** | Library | Extremely fast, low-overhead Node.js JSON logger. |
| **Sentry** | SaaS | Handles error aggregation and source-map parsing for minified Next.js frontend code. |
| **Prometheus / DataDog** | Infra/SaaS | Time-series database for scraping the `/metrics` endpoint to generate Grafana dashboards. |

---

## 15. Engineering Notes

- **Never Swallow Errors:**
  ```typescript
  // BAD
  try { await fetchProvider(); } catch (e) { return null; }
  
  // GOOD
  try { await fetchProvider(); } catch (e) { 
    this.logger.warn({ err: e, context: 'Provider' }, 'Provider failed, falling back to cache');
    return getCache(); 
  }
  ```
- **AsyncLocalStorage:** Use Node's `async_hooks` (AsyncLocalStorage) to inject the `requestId` into the logger globally. This prevents developers from having to pass `requestId` as a parameter to every single function in the codebase.

---

## 16. Recruiter Impact Notes

### 16.1 What This Document Demonstrates
- **Production Readiness:** Bootcamps teach you how to build an app; senior engineering teaches you how to maintain an app when it's on fire at 2 AM. Setting up distributed tracing and structured JSON logging proves production-grade experience.
- **Alert Fatigue Awareness:** Deliberately separating PagerDuty (wake up) from Slack (read tomorrow) alerts demonstrates an understanding of Site Reliability Engineering (SRE) culture and developer burnout prevention.
- **Domain-Specific Risk Mitigation:** Implementing the `audit_logs` specifically for the Framework JSONB configurations shows deep alignment with the product's core value (Ethical Trust).

---

## 17. Business Impact Notes

- **Rapid Issue Resolution:** When a high-net-worth user reports an issue with their portfolio, the support team can provide the `requestId`, allowing engineers to instantly query the exact database state, external API latency, and rule math for that specific request, turning a 3-day investigation into a 5-minute fix.
- **Cost Optimization:** By tracking the "Cache Hit Ratio" metric, the business can accurately calculate how much money the Redis architecture is saving them on API bills, allowing for better financial forecasting.

---

## 18. Document Cross-References

| Document | Relationship |
|---|---|
| `11-backend-architecture.md` | Defines the BullMQ queues and NestJS monolith that must be instrumented with these logging standards. |
| `14-compliance-engine.md` | The complex algorithmic output of this engine is the primary target for DEBUG logging to ensure mathematical accuracy. |
| `16-market-data-system.md` | The Anti-Corruption layer here must heavily log when it falls back to stale cache data. |

---

> **End of Document**
>
> All new API endpoints must have their latency automatically tracked by the metrics middleware. Any endpoint consistently breaching the 500ms P99 threshold must be refactored or cached.
