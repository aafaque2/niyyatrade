# 11 — Backend Architecture

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Principal Backend Architect
> **Audience:** Backend Engineers, DevOps, Product Managers
> **Depends On:** `00-product-foundation.md`, `09-domain-models.md`, `10-database-design.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Core Technology Stack](#5-core-technology-stack)
6. [The Modular Monolith Pattern](#6-the-modular-monolith-pattern)
7. [The Compliance Plugin Architecture](#7-the-compliance-plugin-architecture)
8. [Asynchronous Processing & Background Jobs](#8-asynchronous-processing--background-jobs)
9. [Caching & Performance Strategy](#9-caching--performance-strategy)
10. [Third-Party Data Ingestion (ACL)](#10-third-party-data-ingestion-acl)
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

This document outlines the software architecture of the HalalTrade backend. While `09-domain-models.md` defines the abstract concepts and `10-database-design.md` defines the physical storage, this document defines the actual execution environment. It explains how requests are routed, how code is organized, and how the system prevents tightly coupled "spaghetti code."

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| BA-1 | Enforce Module Isolation | Implement a Modular Monolith where the `Trading` module cannot directly import services from the `Compliance` module. |
| BA-2 | Guarantee Evaluation Speed | Ensure portfolio-wide compliance evaluations resolve in < 500ms using aggressive caching. |
| BA-3 | Standardize Data Ingestion | Implement an Anti-Corruption Layer (ACL) to shield the core engine from third-party API schema changes. |
| BA-4 | Enable Extensibility | The Compliance Engine must accept new rule logic (e.g., ESG) without requiring core framework rewrites. |

---

## 3. Scope

### 3.1 In Scope
- Selection and justification of the backend framework (NestJS / Node.js).
- High-level directory and module structure.
- Implementation details of the Compliance Plugin system.
- Background job processing (Queueing).
- Redis caching implementation.

### 3.2 Out of Scope
- Specific API route URLs and JSON schemas (Covered in `13-api-design.md`).
- Frontend Next.js architecture (Covered in `12-frontend-architecture.md`).
- AWS/GCP infrastructure deployment scripts.

---

## 4. Executive Summary

The HalalTrade backend is built as a **Modular Monolith** using **NestJS (TypeScript)**. 

We explicitly reject the microservices architecture for the MVP. Instead, we use NestJS's robust dependency injection and module boundaries to enforce strict Domain-Driven Design (DDD) contexts within a single deployable codebase. 

The architecture features three critical technical pillars:
1. **The Anti-Corruption Layer (ACL):** Shields the engine from volatile third-party financial data providers.
2. **The Plugin System:** Allows the Compliance Engine to dynamically load rule sets (Halal, ESG) based on JSONB configurations in the database.
3. **The Job Queue:** Utilizes Redis/BullMQ to handle heavy asynchronous tasks, such as re-evaluating 10,000 portfolios when an Islamic scholar updates a threshold.

---

## 5. Core Technology Stack

| Technology | Role | Justification |
|---|---|---|
| **Node.js (TypeScript)** | Runtime | Allows for full-stack type safety (sharing DTOs with the Next.js frontend). High I/O concurrency is ideal for calling external financial APIs. |
| **NestJS** | Framework | Provides strict architectural opinions out-of-the-box. Its Module and Dependency Injection system is perfect for enforcing DDD bounded contexts. |
| **Prisma** | ORM | Type-safe database access. Excellent support for Postgres JSONB (crucial for our framework rule storage). |
| **Redis & BullMQ** | Caching & Queues | Essential for caching expensive compliance evaluations and processing asynchronous jobs (like executing paper trades at market open). |

---

## 6. The Modular Monolith Pattern

A Modular Monolith keeps all code in one repository and deploys as one process, but enforces strict boundaries internally.

### 6.1 Directory Structure
```text
src/
 ├── modules/
 │    ├── identity/       (Bounded Context 1)
 │    ├── trading/        (Bounded Context 2)
 │    ├── compliance/     (Bounded Context 3)
 │    └── market-data/    (Bounded Context 4)
 ├── shared/
 │    ├── utils/          (e.g., Decimal math helpers)
 │    └── dtos/           (Shared with frontend)
 └── main.ts
```

### 6.2 The "No Direct Imports" Rule
The `trading` module handles placing orders. Before executing an order, it might need to check if the user is authenticated. 
- **Banned:** `import { UserService } from '../identity/user.service'` 
- **Required:** Contexts must communicate via explicit Interface boundaries or an internal Event Bus (e.g., `eventEmitter.emit('order.placed')`). If synchronous data is needed, the `IdentityModule` exports a strictly defined `IdentityFacadeService`.

---

## 7. The Compliance Plugin Architecture

The Compliance Engine is the IP of the platform. It must be infinitely extensible.

### 7.1 The Engine Flow
When a request to evaluate AAPL is made:
1. The engine fetches the user's active `FrameworkConfig` (JSONB) from the DB.
2. It fetches the `FinancialFundamentals` for AAPL from the Market Data module.
3. It passes both into the **Evaluator Core**.

### 7.2 The Rule Plugins
The Evaluator Core does not contain hardcoded `if (debt < 33)` statements. Instead, it iterates over the JSONB config and dynamically invokes specific Rule Classes.

```typescript
// Example Interface
export interface ComplianceRulePlugin {
  evaluate(fundamentals: FinancialData, threshold: number): RuleResult;
}

// Example Implementation
export class DebtToEquityRule implements ComplianceRulePlugin {
  evaluate(fundamentals: FinancialData, threshold: number): RuleResult {
    const ratio = (fundamentals.totalDebt / fundamentals.totalEquity) * 100;
    return {
      passed: ratio <= threshold,
      actualValue: ratio,
      explanation: `Total debt of ${fundamentals.totalDebt} over equity of ${fundamentals.totalEquity} is ${ratio}%. Threshold is ${threshold}%.`
    };
  }
}
```
**Why this matters:** To launch an ESG framework, we simply write new Rule Classes (e.g., `CarbonEmissionsRule`) and register them in the Dependency Injection container. The Core Engine never changes.

---

## 8. Asynchronous Processing & Background Jobs

Financial markets operate asynchronously. We use **BullMQ (backed by Redis)** to handle tasks that cannot block the main HTTP thread.

### 8.1 Critical Background Queues
1. **`portfolio-reevaluation-queue`:** 
   - **Trigger:** A user changes their custom threshold from 33% to 30%, OR a company releases a new earnings report.
   - **Action:** The system must retroactively recalculate the compliance score for the user's entire portfolio. This can take seconds and must happen in the background.
2. **`order-execution-queue`:**
   - **Trigger:** A user places a "Market Buy" while the stock market is closed.
   - **Action:** The order remains `PENDING`. BullMQ schedules a job to execute the trade at exactly 9:30 AM EST the next day using the opening market price.

---

## 9. Caching & Performance Strategy

Evaluating compliance requires heavy math and multiple DB lookups. Doing this on every page load will crash the server.

### 9.1 Multi-Layer Caching
1. **Layer 1: External API Cache (Redis)**
   - Financial Fundamentals (e.g., Q3 Balance Sheet) rarely change. We cache external API responses in Redis for 24 hours.
2. **Layer 2: Evaluation Report Cache (Redis)**
   - If User A and User B both use the default Halal Framework, we do not evaluate AAPL twice. The resulting `EvaluationReport` JSON is cached in Redis using a compound key: `eval:AAPL:framework_id:default`.
   - **Cache Invalidation:** The cache is instantly invalidated if the underlying market data changes or if the framework's default rules are updated by an admin.

---

## 10. Third-Party Data Ingestion (ACL)

The `market-data` module serves as the Anti-Corruption Layer (ACL).

### 10.1 The Problem
Financial APIs (like Polygon.io or Financial Modeling Prep) are notoriously messy. They might return `null` for debt, or change a key from `total_debt` to `totalDebtQ3` without warning.

### 10.2 The Solution
The `market-data` module intercepts every external request and forces it through a rigorous Zod validation schema.
- If the external API fails validation, the ACL logs an alert and returns the last known good cached data to the Compliance Engine.
- The rest of the HalalTrade application **never** sees the raw third-party JSON. It only interacts with our sanitized internal DTOs.

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Architecture** | Modular Monolith | Microservices (K8s) | Microservices introduce immense network latency and DevOps overhead. A startup needs deployment speed. A well-structured monolith provides the clean code of microservices without the infrastructure nightmare. |
| **Language** | TypeScript (Node) | Go / Rust | Go is faster for pure compute, but Node.js is fast enough for I/O bound tasks (API calls). TS allows us to share over 100 type definitions (like the `EvaluationReport` schema) directly with the Next.js frontend, preventing massive duplication bugs. |
| **Background Jobs** | BullMQ (Redis) | AWS SQS | BullMQ runs on our existing Redis cluster, keeping infrastructure simple. SQS requires setting up separate AWS IAM roles and polling workers. |

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Memory Leaks in Evaluation** | Medium | Processing large portfolios could create massive objects in memory. **Mitigation:** Ensure the Evaluator Core uses streaming or batching (e.g., processing 50 assets at a time) rather than loading 10,000 assets into memory simultaneously. |
| **Clock Synchronization (Market Hours)** | High | The Paper Trading engine must accurately know when the NYSE/NASDAQ is open to prevent illegal trades. **Mitigation:** Use a reliable, heavily-tested market calendar library. Do not attempt to hand-roll timezone/holiday math for the stock market. |

---

## 13. Future Expansion

| Feature | Architecture Impact | Phase |
|---|---|---|
| **Real-time WebSockets** | Introduce a `websocket` gateway module to stream live price updates (Tick data) directly to the Next.js frontend, bypassing HTTP polling. | Phase 3 |
| **Microservice Extraction** | If the Compliance Engine becomes CPU-bound due to complex AI/ESG evaluations, the `compliance` module can be cleanly extracted from the Monolith into an independent Go/Rust microservice because it already communicates via strict interfaces. | Phase 5 |

---

## 14. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **NestJS / Prisma** | Framework | The core foundation. Version upgrades must be handled carefully. |
| **Zod** | Library | Essential for the Anti-Corruption Layer. Validates incoming external financial data. |
| **Decimal.js** | Library | Essential for the `trading` module to guarantee precision when executing paper trades (preventing floating-point errors). |

---

## 15. Engineering Notes

- **Error Handling Standardization:** Create a global Exception Filter in NestJS. Do not return stack traces to the frontend. Map domain errors (e.g., `InsufficientFundsError`) to standard HTTP codes (e.g., `400 Bad Request`) with a localized error message suitable for UI display.
- **Dependency Injection:** Use interfaces for third-party providers. E.g., `IProviderService`. Inject `PolygonService` in production, but inject `MockMarketService` during E2E testing to prevent incurring API costs.

---

## 16. Recruiter Impact Notes

### 16.1 What This Document Demonstrates
- **Architectural Maturity:** Choosing a Modular Monolith over trendy Microservices shows pragmatic, senior-level judgment. It optimizes for the realities of a startup (speed, low infra cost) while preventing technical debt.
- **Defensive Programming:** The emphasis on the Anti-Corruption Layer (ACL) and Zod validation demonstrates an understanding of how third-party dependencies actually behave in production (they break unexpectedly).
- **Extensibility Planning:** The Plugin Architecture for the Compliance Engine proves the ability to design software that accommodates future business pivots (e.g., pivoting to ESG) without rewriting the core.

---

## 17. Business Impact Notes

- **Infrastructure Cost Control:** By utilizing a Monolith and heavy Redis caching, MVP hosting costs are kept extremely low (a single robust server/container + a database) compared to managing a cluster of microservices.
- **Go-to-Market Speed:** Sharing TypeScript DTOs between the backend and frontend eliminates the traditional "API integration" phase, massively accelerating the delivery of the MVP.

---

## 18. Document Cross-References

| Document | Relationship |
|---|---|
| `09-domain-models.md` | The modules in this architecture map directly to the Bounded Contexts defined there. |
| `14-compliance-engine.md` | Details the specific math executed inside the Plugin Architecture outlined here. |
| `13-api-design.md` | Details the external HTTP interfaces exposed by this architecture. |

---

> **End of Document**
>
> All backend Pull Requests must pass an architectural boundary check. If a PR imports a service across bounded contexts without using the established Facade/Interface, the PR must be rejected.
