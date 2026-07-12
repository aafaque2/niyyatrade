# Implementation Audit Protocol

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-07-02
> **Owner:** Principal Architect / Tech Lead
> **Audience:** Engineering Team, QA, Code Reviewers
> **Depends On:** All architecture documents (`09` through `14`)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [The "Stop The Line" Violations (P0)](#3-the-stop-the-line-violations-p0)
4. [Backend Audit Checklist](#4-backend-audit-checklist)
5. [Frontend Audit Checklist](#5-frontend-audit-checklist)
6. [Database & Infrastructure Audit Checklist](#6-database--infrastructure-audit-checklist)
7. [Automated Enforcement](#7-automated-enforcement)
8. [Document Cross-References](#8-document-cross-references)

---

## 1. Purpose

The HalalTrade architecture is built on a series of strict constraints (e.g., Bounded Contexts, Integer Currency, Anti-Corruption Layers). If these constraints are violated during implementation, the platform's multi-framework scalability and financial accuracy will collapse.

This document serves as the ultimate checklist for Pull Request (PR) reviews and weekly engineering audits. It ensures the codebase actually matches the documentation.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| IA-1 | Prevent Architecture Drift | Ensure the codebase does not turn into a "Big Ball of Mud" over time. |
| IA-2 | Guarantee Financial Safety | Catch any floating-point math or unsafe ledger mutations before they reach production. |
| IA-3 | Standardize Code Reviews | Give engineers a concrete rubric for approving or rejecting Pull Requests. |

---

## 3. The "Stop The Line" Violations (P0)

If any of the following are found in a PR, the PR must be **rejected immediately**. No exceptions.

1. **Floating Point Money:** The use of `number` or `float` types for cash or price calculations instead of Integer cents (or `Decimal.js` for shares).
2. **Cross-Context Bleed:** The Trading Engine directly modifying the Compliance Engine's models, or vice versa, bypassing established interfaces.
3. **Hardcoded Compliance Logic:** Writing `if (industry === 'Alcohol')` in the core engine instead of utilizing the dynamic JSONB Plugin Architecture.
4. **Bypassing the ACL:** The UI or the Compliance Engine calling the third-party market data provider (e.g., Polygon.io) directly instead of going through the internal `MarketDataModule`.

---

## 4. Backend Audit Checklist

**Reviewing NestJS / Node.js Code:**

- [ ] **Dependency Injection:** Are external services injected via interfaces to allow for mocking during tests?
- [ ] **Error Envelopes:** Do all HTTP responses conform strictly to the `{ data, error, meta }` envelope defined in `13-api-design.md`?
- [ ] **Domain Isolation:** Does the `trading` module import anything directly from the `compliance` module's internal services? *(If yes -> Reject).*
- [ ] **Input Validation:** Are all external inputs (from the frontend or third-party APIs) passed through strict Zod schemas?
- [ ] **Asynchronous Processing:** Are long-running tasks (like portfolio re-evaluations) properly pushed to BullMQ rather than blocking the HTTP thread?
- [ ] **Test Coverage:** Do new `RuleEvaluator` plugins include 100% test coverage, including the handling of `null` (Insufficient Data) inputs?

---

## 5. Frontend Audit Checklist

**Reviewing Next.js / React Code:**

- [ ] **Server vs. Client State:** Is data that lives in the database managed exclusively by TanStack Query? Is Zustand strictly limited to ephemeral UI state (e.g., modals, dark mode)?
- [ ] **The "Leaves are Client" Rule:** Are `'use client'` directives pushed down to the smallest possible components (like buttons or inputs) rather than sitting at the top of the `page.tsx` file?
- [ ] **Suspense Boundaries:** Does the Asset page use `<Suspense>` to load the Chart and Compliance rules in parallel to prevent layout blocking?
- [ ] **Third-Party Integrations:** Is the TradingView chart properly destroyed in the `useEffect` cleanup return function to prevent memory leaks?
- [ ] **Dumb UI:** Is the frontend calculating compliance math or generating explanation strings? *(If yes -> Reject. The backend generates explanations).*
- [ ] **Hardcoded Branding:** Is the string "HalalTrade" hardcoded anywhere in the JSX, or is it using the `NEXT_PUBLIC_APP_NAME` env variable?

---

## 6. Database & Infrastructure Audit Checklist

**Reviewing Prisma / Postgres Schema:**

- [ ] **Integer Cents:** Are all currency columns explicitly typed as `BIGINT`?
- [ ] **Fractional Shares:** Are all share quantity columns explicitly typed as `DECIMAL(15, 6)`?
- [ ] **JSONB Usage:** Are user-specific compliance overrides stored cleanly in `JSONB` to avoid column bloat?
- [ ] **Indexes:** Do all foreign keys have accompanying database indexes to prevent table scans on heavy read paths (like loading a portfolio)?
- [ ] **Transaction Safety:** Does the `executeOrder` mutation wrap the cash deduction and the position update inside a single, locking Postgres `TRANSACTION` (`SELECT ... FOR UPDATE`)?

---

## 7. Automated Enforcement

To reduce human error during code reviews, the team will implement the following automated checks in CI/CD:

1. **ESLint Boundaries Plugin:** Automatically fails the build if a file in `src/modules/trading` imports from `src/modules/compliance`.
2. **Type-Checking:** Enforces strict TypeScript compiler rules (`strictNullChecks`, `noImplicitAny`).
3. **Prisma Format & Validate:** Ensures the database schema matches the defined abstractions.

---

## 8. Document Cross-References

| Document | Relationship |
|---|---|
| `11-backend-architecture.md` | Provides the backend rules being audited. |
| `12-frontend-architecture.md` | Provides the frontend rules being audited. |
| `10-database-design.md` | Provides the schema rules being audited. |

---

> **End of Document**
