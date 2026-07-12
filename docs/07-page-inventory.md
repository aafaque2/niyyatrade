# 07 — Page Inventory

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Product & Frontend Engineering
> **Audience:** Design, Engineering, QA
> **Depends On:** `05-information-architecture.md`, `06-design-system.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Public & Authentication Pages](#5-public--authentication-pages)
6. [Core Trading & Evaluation Pages](#6-core-trading--evaluation-pages)
7. [Dashboard & Portfolio Pages](#7-dashboard--portfolio-pages)
8. [Configuration & History Pages](#8-configuration--history-pages)
9. [Global / Floating Views (Modals & Palettes)](#9-global--floating-views-modals--palettes)
10. [Admin Pages (Internal)](#10-admin-pages-internal)
11. [Page States & Edge Cases](#11-page-states--edge-cases)
12. [Tradeoffs](#12-tradeoffs)
13. [Risks](#13-risks)
14. [Future Expansion](#14-future-expansion)
15. [Dependencies](#15-dependencies)
16. [Engineering Notes](#16-engineering-notes)
17. [Recruiter Impact Notes](#17-recruiter-impact-notes)
18. [Business Impact Notes](#18-business-impact-notes)
19. [Document Cross-References](#19-document-cross-references)

---

## 1. Purpose

This document provides a comprehensive inventory of every discrete page, screen, and major modal within the HalalTrade application. While the Information Architecture (`05-information-architecture.md`) defines the flow and routing, this document details exactly what exists on each page, the specific data it requires, and its priority for MVP delivery. 

It serves as the master checklist for designers creating Figma files, frontend engineers building React components, and QA engineers writing test coverage.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| PI-1 | Catalog all required UI views | Every route defined in the IA has a corresponding detailed page specification here. |
| PI-2 | Define data dependencies | Explicitly list what Backend/API data each page requires to render. |
| PI-3 | Establish page-level MVP priorities | Categorize pages as P0 (Blocker), P1 (Critical), P2 (Fast Follow), to guide sprint planning. |
| PI-4 | Map URL structure to UI | Connect the conceptual page to its exact Next.js route path. |

---

## 3. Scope

### 3.1 In Scope
- Public marketing and authentication pages.
- Logged-in user experience (Portfolio, Assets, Watchlist, Frameworks).
- Global UI overlays (Command Palette, universal modals).
- Definition of Loading, Empty, and Error states for critical views.

### 3.2 Out of Scope
- Granular component-level specs (e.g., "Button has 4px radius") — this belongs in `08-component-library.md`.
- Marketing site sub-pages (e.g., Terms of Service, Privacy Policy text).
- API payload schema definitions — this belongs in `13-api-design.md`.

---

## 4. Executive Summary

The MVP page inventory is intentionally constrained to ensure high quality on the core flows. 

The application is heavily consolidated: rather than having separate pages for "Screening", "Trading", and "Education", they are entirely merged into the **Asset Detail Page (`/assets/[ticker]`)**. This single page is the most complex surface in the application and carries the highest engineering risk. 

By pushing complexity into a few deeply functional pages (Asset Detail, Portfolio Dashboard) and relying on the Command Palette for navigation, we reduce the total page count, accelerating development and simplifying the user experience.

---

## 5. Public & Authentication Pages

### 5.1 Marketing Landing Page
- **Route:** `/`
- **Priority:** P0
- **Purpose:** Communicate the value proposition and drive conversion.
- **Key Elements:**
  - Hero section with clear value prop ("Compliance-aware investing operating system").
  - Search Bar mock (interactive, allows users to search a ticker and immediately routes to the Asset Detail page as a guest).
  - Feature highlights: Pluggable Frameworks, Paper Trading, Explainability.
- **Data Needs:** None (Static).

### 5.2 Authentication (Login / Register)
- **Route:** `/login` & `/register`
- **Priority:** P0
- **Purpose:** Onboard users securely.
- **Key Elements:**
  - Google OAuth single-click button (Primary).
  - Email/Password form (Secondary).
  - "Continue as Guest" escape hatch.
- **Data Needs:** Auth.js integration.

---

## 6. Core Trading & Evaluation Pages

### 6.1 Asset Detail Page (The Core Loop)
- **Route:** `/assets/[ticker]`
- **Priority:** P0
- **Purpose:** The heart of the platform. Evaluates the asset against compliance frameworks and allows paper trading execution.
- **Access:** Available to Guests (Read-only execution) and Registered Users.
- **Key Elements:**
  - **Header:** Ticker, Company Name, Real-time(ish) Price, Daily Change.
  - **Chart:** TradingView Lightweight Chart (1D, 1W, 1M, 1Y, ALL).
  - **Compliance Card:** 
    - Active Framework Selector.
    - Overall Verdict (✅/❌/⚠️).
    - Expandable rule-by-rule accordion explaining the math and theory.
  - **Order Ticket:** Buy/Sell, Market/Limit toggle, Quantity input, Estimated Total, Submit button.
  - **Key Statistics:** Market Cap, P/E, Div Yield, Volume.
- **Data Needs:** 
  - `GET /api/v1/market-data/[ticker]` (Price, Stats, Chart Candles).
  - `GET /api/v1/compliance/evaluate?asset=[ticker]` (Engine evaluation output).

---

## 7. Dashboard & Portfolio Pages

### 7.1 Portfolio Dashboard
- **Route:** `/portfolio`
- **Priority:** P0
- **Purpose:** Give the user an overview of their financial performance and their portfolio's compliance health.
- **Access:** Registered Users only.
- **Key Elements:**
  - **Hero Metrics:** Total Virtual Balance, Purchasing Power, Daily PnL.
  - **Portfolio Compliance Score:** A massive, visual gauge showing the % of the portfolio currently aligned with the active framework.
  - **Holdings Table:** List of owned assets with columns: Asset, Qty, Avg Price, Current Price, Return, and **Compliance Status Badge**.
  - **Recent Activity Mini-feed:** Last 3 trades or compliance alerts.
- **Data Needs:**
  - `GET /api/v1/portfolio/summary`.
  - Batch compliance evaluation for all holdings.

### 7.2 Watchlist
- **Route:** `/watchlist`
- **Priority:** P1
- **Purpose:** Track assets of interest and their compliance status.
- **Key Elements:**
  - Data table similar to Portfolio holdings, but prioritizing daily price action and compliance status over personal PnL.
  - "Add Symbol" inline input.
- **Data Needs:** `GET /api/v1/watchlist`.

---

## 8. Configuration & History Pages

### 8.1 Framework Configuration Center
- **Route:** `/frameworks`
- **Priority:** P0
- **Purpose:** Allow users to switch active frameworks or parameterize their thresholds.
- **Key Elements:**
  - **Active Framework Selector:** Visual cards for available plugins (e.g., Halal Default, Custom Halal, ESG).
  - **Threshold Sliders/Inputs:** (e.g., Adjusting Debt-to-Equity from 33% to 30%).
  - **Save & Re-evaluate Button:** Triggers the background job to rescore the portfolio.
- **Data Needs:** 
  - `GET /api/v1/frameworks` (Available plugins).
  - `GET /api/v1/users/me/framework-prefs` (User overrides).

### 8.2 Order & Compliance History
- **Route:** `/history`
- **Priority:** P2
- **Purpose:** Audit trail for trades and compliance shifts.
- **Key Elements:**
  - **Tabs:** "Orders" and "Compliance Audits".
  - **Orders Tab:** Standard trade ledger (Date, Ticker, Action, Qty, Price, Status).
  - **Compliance Tab:** Log of when assets changed status (e.g., "AAPL changed from Compliant to Non-Compliant due to Q3 earnings report").
- **Data Needs:** `GET /api/v1/history/...`

### 8.3 User Settings
- **Route:** `/settings`
- **Priority:** P1
- **Purpose:** Account management.
- **Key Elements:** Profile info, Password reset, Reset Virtual Portfolio Balance (panic button).
- **Data Needs:** Auth context.

---

## 9. Global / Floating Views (Modals & Palettes)

These views exist outside the standard routing tree and can be summoned over any page.

### 9.1 Global Command Palette (Cmd+K)
- **Priority:** P0
- **Trigger:** `Cmd+K` or clicking the top search bar.
- **Elements:**
  - Search input with rapid debounce.
  - Categorized results: "Assets", "Navigation", "Actions" (e.g., "Switch to ESG Framework").
- **Data Needs:** Client-side routing map + fast `GET /api/v1/search` endpoint.

### 9.2 Framework Comparison Modal
- **Priority:** P1
- **Trigger:** "Compare Frameworks" button on the Asset Detail page.
- **Elements:** Side-by-side tabular view showing how the same ticker scores under Framework A vs. Framework B.

### 9.3 Auth Intercept Modal
- **Priority:** P0
- **Trigger:** Guest user clicks a protected action (e.g., "Buy").
- **Elements:** Streamlined login/signup UI that redirects back to the *exact same state* after authentication.

---

## 10. Admin Pages (Internal)

*Note: These are explicitly low-design, functional-only pages built rapidly using Shadcn UI defaults. Not accessible to public users.*

### 10.1 System Health & Overrides
- **Route:** `/admin/system`
- **Priority:** P2
- **Key Elements:** 
  - API Rate Limit monitors (Market Data APIs are expensive; we need visibility).
  - Background Job queue status (for portfolio re-evaluations).
  - Feature flag toggles.

### 10.2 User Management
- **Route:** `/admin/users`
- **Priority:** P2
- **Key Elements:** Basic CRUD for user accounts to handle support tickets (e.g., manually resetting a broken portfolio state).

---

## 11. Page States & Edge Cases

Every P0/P1 page must explicitly design for the following states:

| State | Definition & Implementation Rule |
|---|---|
| **Loading** | No full-page spinners. Use tailored Skeleton components that match the layout of the incoming data to prevent Cumulative Layout Shift (CLS). |
| **Empty** | Must have an illustration/icon, a helpful message, and a **Clear Call to Action**. (e.g., Empty Portfolio -> "Your portfolio is empty. Search for an asset to place your first paper trade.") |
| **Error (Data)** | If market data fails but compliance data loads, degrade gracefully. Show the compliance card but display "Chart Unavailable" rather than crashing the whole page. |
| **Error (System)** | Clean 404 and 500 pages that include a button to return to the Portfolio and a link to search. |
| **Insufficient Data** | The Compliance Engine specific state. Rendered in gray/slate. "We do not have enough financial data to evaluate this asset." |

---

## 12. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Consolidation** | Single Asset Detail Page | Separate "Screener" and "Trading" pages | Integrating compliance education *into* the trading flow is our core product principle. Splitting them ruins the "Teach Through Usage" goal. |
| **Search Paradigm** | Command Palette | Browseable Market Lists | Building UIs to browse thousands of stocks by sector/industry is complex and low-value for MVP. Search is faster to build and faster for the user. |
| **Admin UI Polish** | None | High Polish | Admin tools are internal only. Zero time should be spent making them pretty. Use raw, un-themed component primitives. |

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Asset Page Overload** | High | The `/assets/[ticker]` page is extremely dense. On mobile, this could become an infinite, confusing scroll. **Mitigation:** Strict use of progressive disclosure (accordions, tabs on mobile) to hide secondary data until requested. |
| **Stale Data on Back Navigation** | Medium | User sells a stock on `/assets`, hits the browser Back button to `/portfolio`, and still sees the stock. **Mitigation:** Aggressive cache invalidation using TanStack Query whenever an order is submitted. |

---

## 14. Future Expansion

| Feature | New Pages Required | Phase |
|---|---|---|
| **Purification Calculator** | `/portfolio/purification` (Wizard UI) | Phase 2 |
| **Custom Framework Builder** | `/frameworks/builder` (Complex drag-and-drop rule UI) | Phase 4 |
| **Community Framework Store** | `/frameworks/discover` (Marketplace UI with reviews/ratings) | Phase 5 |

---

## 15. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Information Architecture (`05`)** | Product | The routing schema defined there dictates the URLs listed here. |
| **TradingView Lightweight Charts** | Frontend | The core visual element of the `/assets` page. Its integration limits/capabilities dictate the page layout. |

---

## 16. Engineering Notes

- **Next.js Parallel Routes:** For the Asset Detail page (`/assets/[ticker]`), utilize Next.js parallel routes and suspense boundaries. The Market Data and the Compliance Evaluation are independent API calls; they should stream into the UI independently so the user isn't waiting on the slowest API to see the page structure.
- **Command Palette Pre-fetching:** To make the Cmd+K experience feel instant, pre-fetch the user's Portfolio and Watchlist tickers into the client-side search index on initial load.

---

## 17. Recruiter Impact Notes

### 17.1 What This Document Demonstrates
- **Scope Management:** Categorizing pages strictly by priority (P0 vs P2) shows an understanding of how to ship an MVP without getting bogged down in non-critical views like Admin panels.
- **Frontend State Mastery:** Explicitly demanding designs for Loading, Empty, and Error states demonstrates senior frontend experience; junior engineers often only build for the "Happy Path."
- **Graceful Degradation:** The edge case handling (Section 11) proves an understanding of distributed systems—if a third-party pricing API goes down, the compliance engine should still render.

---

## 18. Business Impact Notes

- **Development Velocity:** By drastically reducing the number of distinct pages and relying on reusable components and a powerful Command Palette, the engineering team can deliver the MVP significantly faster than a traditional multi-page application approach.
- **Conversion Focus:** Treating the `/assets/[ticker]` page as both a public landing page (for SEO/Shareability) and the core authenticated tool ensures that every piece of engineering effort put into that page directly drives both user acquisition and user retention.

---

## 19. Document Cross-References

| Document | Relationship |
|---|---|
| `04-user-journeys.md` | The flows defined there happen across the pages inventoried here. |
| `05-information-architecture.md` | Provides the navigational skeleton that connects these pages. |
| `08-component-library.md` | The atomic components needed to construct the pages listed here (e.g., the Compliance Card, the Order Ticket). |
| `19-mvp-definition.md` | Relies on the P0 designations in this document to draw the final scope line. |

---

> **End of Document**
>
> Adding new top-level pages to this inventory requires a justification against the "Simplicity Over Complexity" product principle.
