# 12 — Frontend Architecture

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Principal Frontend Engineer
> **Audience:** Frontend Engineers, UX Designers, Product Managers
> **Depends On:** `05-information-architecture.md`, `08-component-library.md`, `13-api-design.md`

*(Note: File was sequence-corrected from 11 to 12 to maintain alignment with the Master Context).*

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Core Technology Stack](#5-core-technology-stack)
6. [Next.js App Router Strategy](#6-nextjs-app-router-strategy)
7. [State Management (Server vs. Client)](#7-state-management-server-vs-client)
8. [Data Fetching & Caching (TanStack Query)](#8-data-fetching--caching-tanstack-query)
9. [Component Rendering (RSC vs. Client Components)](#9-component-rendering-rsc-vs-client-components)
10. [Third-Party Integrations (TradingView)](#10-third-party-integrations-tradingview)
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

This document outlines the technical architecture of the HalalTrade frontend client. It defines how data moves from the backend API into the React component tree, how global state is managed, and how the application achieves the "Fast, Premium" UX mandated by the product foundation.

In a highly interactive financial dashboard, poor frontend architecture leads to cascading re-renders, sluggish charts, and stale portfolio data. This document sets the guardrails to prevent those failures.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| FA-1 | Guarantee Data Freshness | Ensure that when a trade executes, the portfolio balance and holdings update instantly across all views. |
| FA-2 | Optimize the Asset Page | The `/assets/[ticker]` page must load its layout instantly, streaming the chart and compliance data in parallel. |
| FA-3 | Isolate Re-renders | A user typing in the "Quantity" input of the Order Ticket must not cause the TradingView chart to re-render. |
| FA-4 | Maximize Code Reuse | Strictly separate "dumb" UI components (`08-component-library.md`) from "smart" data-fetching containers. |

---

## 3. Scope

### 3.1 In Scope
- Next.js App Router utilization (Layouts, Suspense, Parallel Routes).
- State management strategy (TanStack Query for server state, Zustand for client state).
- React Server Components (RSC) usage guidelines.
- Performance optimization for heavy DOM elements (Charts).

### 3.2 Out of Scope
- Backend database or API implementation (Covered in `11-backend-architecture.md`).
- CSS styling rules and design tokens (Covered in `06-design-system.md`).
- Mobile app (React Native) architecture.

---

## 4. Executive Summary

The HalalTrade frontend is a **Next.js (App Router)** application written in **TypeScript**. 

It relies on a strict bifurcation of state: **Server State** (e.g., Portfolio balances, Compliance evaluations, Market quotes) is exclusively managed by **TanStack Query (React Query)** to handle caching, background refetching, and stale-while-revalidate logic. **Client State** (e.g., Command Palette open/close, active UI tab) is managed locally via React `useState` or globally via **Zustand**.

The architecture heavily leverages React Suspense to ensure the UI feels instant. On the critical Asset Detail page, market data and compliance data fetch in parallel, preventing the slowest backend API from blocking the rendering of the page layout.

---

## 5. Core Technology Stack

| Technology | Role | Justification |
|---|---|---|
| **Next.js (App Router)** | Framework | Provides built-in file-system routing, Server Components for reduced JavaScript bundle sizes, and SEO capabilities for public asset pages. |
| **React 18+** | UI Library | The industry standard. Utilizes Concurrent features (Suspense) for complex rendering. |
| **TypeScript** | Language | Shares strict DTO schemas (like `EvaluationReport`) with the NestJS backend. Eliminates undefined errors in financial data. |
| **TanStack Query (v5)** | Server State | The premier tool for data fetching. Eliminates the need for Redux by handling caching, deduping, and cache invalidation natively. |
| **Zustand** | Client State | A tiny, un-opinionated state manager used *only* for global UI toggles (like the Cmd+K palette). |

---

## 6. Next.js App Router Strategy

The `app/` directory uses layout nesting to prevent redundant re-rendering of global navigation.

### 6.1 Directory Structure
```text
src/
 ├── app/
 │    ├── (auth)/         # Layout without sidebar
 │    │    └── login/
 │    ├── (app)/          # Layout with global sidebar & AuthGuard
 │    │    ├── layout.tsx # Injects Navigation & Cmd+K Provider
 │    │    ├── portfolio/
 │    │    ├── assets/[ticker]/
 │    │    └── frameworks/
 │    └── globals.css
```

### 6.2 Parallel Routes & Intercepts
For the "Guest-to-User Conversion Funnel" (defined in `04-user-journeys.md`), we utilize Next.js **Intercepting Routes**. 
When a guest clicks "Buy" on `/assets/AAPL`, Next.js intercepts the route and renders the `/login` page as a modal *over* the current page, preserving their exact context rather than doing a hard redirect.

---

## 7. State Management (Server vs. Client)

The biggest mistake in modern React is putting Server data into a Client state manager (like Redux).

### 7.1 Server State (TanStack Query)
Any data that lives in the Postgres Database belongs to TanStack Query.
- Example: `usePortfolio()`, `useAssetCompliance(ticker)`, `useMarketData(ticker)`.
- **Invalidation:** When an `executeOrder` mutation succeeds, we call `queryClient.invalidateQueries({ queryKey: ['portfolio'] })`. This instantly triggers a background refetch, updating the UI seamlessly.

### 7.2 Client State (Zustand)
Only UI ephemeral state that needs to be accessed globally.
- Example: `useCommandPaletteStore()`.
- If state only belongs to one page (e.g., the inputted quantity in the Order Ticket), it stays in local `useState`.

---

## 8. Data Fetching & Caching (TanStack Query)

Financial data has different caching needs. TanStack query keys must be meticulously designed.

### 8.1 The "Stale Time" Strategy
| Data Type | Query Key Pattern | Stale Time | Rationale |
|---|---|---|---|
| **Market Quote** | `['quote', ticker]` | 1 minute | Prices change constantly. Fetch frequently. |
| **Compliance Report** | `['compliance', ticker, frameworkId]` | 24 hours | Fundamental data (Debt) only changes quarterly. Caching this aggressively saves massive backend compute. |
| **Portfolio** | `['portfolio', userId]` | 5 minutes | Balances change when orders execute (handled by invalidation) or slowly over the day. |

### 8.2 Optimistic Updates
When a user changes a framework threshold (e.g., from 33% to 30%), the backend takes time to re-evaluate the portfolio. We use Optimistic Updates: we immediately update the UI slider to 30% while the mutation runs in the background, keeping the app feeling snappy.

---

## 9. Component Rendering (RSC vs. Client Components)

Next.js App Router introduces React Server Components (RSC). 

### 9.1 The "Leaves are Client" Rule
To maximize performance, push the `"use client"` directive as far down the component tree as possible (to the "leaves").
- **Page (`page.tsx`):** Server Component. Reads the URL params.
- **Layout (`layout.tsx`):** Server Component.
- **Order Ticket (`<OrderTicket />`):** Client Component. Needs `onChange` inputs and `useState`.
- **Chart (`<TradingViewChart />`):** Client Component. Uses DOM refs and `useEffect`.

By keeping the page wrapper as a Server Component, the massive JSON payload of the compliance rules can be rendered into HTML on the server, shipping zero JavaScript for the text explanations.

### 9.2 Suspense Boundaries
The Asset Detail page uses Suspense to avoid waterfall loading:
```tsx
<div className="grid">
  {/* Left: Fetches Market Data */}
  <Suspense fallback={<ChartSkeleton />}>
    <MarketDataContainer ticker={ticker} />
  </Suspense>

  {/* Right: Fetches Compliance Logic */}
  <Suspense fallback={<ComplianceSkeleton />}>
    <ComplianceContainer ticker={ticker} />
  </Suspense>
</div>
```

---

## 10. Third-Party Integrations (TradingView)

Integrating imperative, non-React libraries (like Lightweight Charts) into React is high risk for memory leaks.

### 10.1 Integration Rules
1. **Ref-based mounting:** The chart must only be initialized once inside a `useEffect` using a `useRef` to target the DOM node.
2. **Cleanup:** The `useEffect` return function must call `chart.remove()` to destroy the canvas instance when the user navigates away. Failure to do this will cause the browser to crash after viewing 20 assets.
3. **Memoization:** Wrap the chart wrapper in `React.memo()`. The chart exposes its own `setData()` API; we should push data to it imperatively rather than letting React re-render the DOM container.

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Data Fetching** | TanStack Query (Client) | RSC Data Fetching (Server) | While RSC `fetch()` is the new Next.js standard, financial apps require aggressive polling, background refetching, and complex cache invalidation (like invalidating portfolio after a trade). TanStack Query handles this infinitely better than raw RSCs. |
| **CSS Approach** | Tailwind CSS | CSS Modules | Standardized across the design system (`06`). Tailwind eliminates the massive CSS bundle sizes that normally accompany complex dashboards. |

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Chart Re-render Jitter** | High | If the `page.tsx` state changes, the Chart component re-renders, causing a visible flash. **Mitigation:** Strict enforcement of the "Leaves are Client" rule and `React.memo` on the chart. |
| **TypeScript Any Abuse** | Medium | Developers using `any` for API responses. **Mitigation:** Share the exact TypeScript types from the NestJS backend via a monorepo package or generated SDK. The frontend `EvaluationReport` type must exactly match the backend. |

---

## 13. Future Expansion

| Feature | Architecture Impact | Phase |
|---|---|---|
| **WebSockets (Live Pricing)** | TanStack Query must be integrated with WebSocket event listeners to dynamically update the cache (`queryClient.setQueryData`) as ticks arrive, rather than HTTP polling. | Phase 3 |
| **React Native App** | The strict separation of Data Fetching (Hooks) from UI Components allows us to reuse 100% of the TanStack Query hooks in the React Native codebase. | Phase 4 |

---

## 14. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Next.js** | Core | Major version updates must be regression-tested carefully due to aggressive caching behaviors in the App Router. |
| **Zod** | Utility | Used on the frontend to parse and validate URL query parameters (e.g., ensuring `?qty=5` is actually a number). |

---

## 15. Engineering Notes

- **Query Key Factories:** Never hardcode query keys (e.g., `['asset', 'AAPL']`). Create a central `queryKeys.ts` file with factory functions: `export const assetKeys = { detail: (ticker: string) => ['asset', ticker] as const }`. This prevents typos causing severe cache invalidation bugs.
- **Error Boundaries:** Wrap critical page segments in `error.tsx` (Next.js native). If the TradingView chart crashes, the Compliance Engine and Order Ticket should remain functional.

---

## 16. Recruiter Impact Notes

### 16.1 What This Document Demonstrates
- **Modern React Mastery:** Shows a deep understanding of the current React ecosystem, specifically the nuanced differences between Server State (TanStack) and Client State (Zustand), and RSCs vs. Client components.
- **Performance Focus:** Understanding that initializing heavy libraries like TradingView inside a standard React render cycle causes memory leaks proves senior-level frontend experience.
- **UX-Driven Engineering:** The use of Suspense boundaries to load the Compliance data and Chart data in parallel directly supports the product goal of a "Fast, Premium" experience.

---

## 17. Business Impact Notes

- **Time to Market:** By utilizing TanStack Query for all state management, the engineering team avoids spending weeks writing Redux boilerplate, reducers, and thunks.
- **SEO & Shareability:** Using Next.js allows the `/assets/[ticker]` pages to be indexed by search engines, turning every evaluated stock into a potential organic acquisition landing page for users searching "Is AAPL Halal?".

---

## 18. Document Cross-References

| Document | Relationship |
|---|---|
| `11-backend-architecture.md` | Defines the APIs that TanStack Query will consume. |
| `08-component-library.md` | Provides the dumb UI components that this architecture wires data into. |
| `04-user-journeys.md` | Defines the specific interactions (like Guest Intercepts) that require complex routing logic. |

---

> **End of Document**
>
> Any proposal to introduce a new global state management library (e.g., Redux, Recoil) must be heavily scrutinized. Zustand + TanStack Query is sufficient for 99% of frontend requirements.
