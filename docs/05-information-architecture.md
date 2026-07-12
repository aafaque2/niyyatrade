# 05 — Information Architecture

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** UX Design & Frontend Engineering
> **Audience:** Design, Engineering, Product
> **Depends On:** `00-product-foundation.md`, `04-user-journeys.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Core Navigation Paradigm](#5-core-navigation-paradigm)
6. [High-Level Site Map](#6-high-level-site-map)
7. [URL Structure & Routing](#7-url-structure--routing)
8. [Page Hierarchies & Layouts](#8-page-hierarchies--layouts)
9. [Information Density & Progressive Disclosure](#9-information-density--progressive-disclosure)
10. [Cross-Linking Strategy](#10-cross-linking-strategy)
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

This document defines the structural layout, navigation pathways, and organizational model of HalalTrade (working name). The Information Architecture (IA) acts as the bridge between the user journeys (`04-user-journeys.md`) and the actual component library (`08-component-library.md`). It dictates how information is grouped, how users orient themselves within the platform, and how the underlying Next.js file-system routing should be constructed.

For a compliance-aware investing operating system, the IA must balance the deep data density of a financial terminal (like TradingView) with the approachability of a consumer app (like Robinhood). 

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| IA-1 | Establish a flat hierarchy | Users should reach any primary function (Search, Portfolio, Settings) in no more than 2 clicks from anywhere. |
| IA-2 | Separate Action from Configuration | Clearly divide the "Trading/Evaluation" loop from the "Framework Configuration" loop. |
| IA-3 | Map Next.js Routes | Provide a 1:1 mapping between the logical IA and the physical Next.js `app/` directory structure. |
| IA-4 | Standardize Progressive Disclosure | Define exactly how and when complex financial/compliance data is revealed. |

---

## 3. Scope

### 3.1 In Scope
- Global navigation mechanisms (Command Palette, Sidebar).
- Site map (Authenticated vs. Unauthenticated).
- URL structure and dynamic routing schemas.
- Hierarchy of the Asset Detail page (the most complex view).
- IA for the Compliance Framework settings.

### 3.2 Out of Scope
- Detailed visual mockups or wireframes (belongs in Figma / `06-design-system.md`).
- Specific API data payloads (belongs in `13-api-design.md`).
- Marketing landing pages beyond the primary conversion funnel.

---

## 4. Executive Summary

HalalTrade utilizes a **Flat, Search-First Information Architecture**. 

Because there are thousands of assets, hierarchical browsing (e.g., Markets -> Sectors -> Tech -> AAPL) is inefficient. Instead, we use a global **Command Palette (Cmd+K)** as the primary navigation engine, supported by a minimal, collapsible left sidebar for top-level domains (Portfolio, Watchlist, Frameworks).

The core of the application revolves around the **Asset View** (`/assets/[ticker]`). This view embodies our "Teach Through Usage" principle by placing the Compliance Engine output directly alongside the price chart and order execution interface, rather than burying it in a separate "Compliance" tab.

---

## 5. Core Navigation Paradigm

### 5.1 The Command Palette (Cmd+K)
Inspired by Linear and Raycast, the Command Palette is the universal entry point.
- **Why:** Financial platforms require rapid context switching. Users want to jump from viewing their portfolio to evaluating a specific ticker instantly.
- **Functionality:** 
  - Ticker Search (e.g., typing "TSLA" navigates to `/assets/TSLA`).
  - Action Search (e.g., typing "Switch Framework" opens the framework selector).
  - Navigation (e.g., typing "Go to Settings").

### 5.2 The Global Sidebar (Authenticated State)
A minimal, fixed-left (desktop) or bottom-tab (mobile) navigation.
- **Search (Primary Action)** — Opens Cmd+K palette.
- **Portfolio** — The user's holdings and aggregate compliance score.
- **Watchlist** — Saved assets.
- **Frameworks** — Compliance engine settings and thresholds.
- **History** — Order history and compliance audit logs.
- **Profile/Settings** — Bottom-anchored. Account details.

### 5.3 The Contextual Top Bar
Provides localized context and actions based on the current view.
- **Breadcrumbs** (e.g., `Portfolio / AAPL`).
- **Active Framework Indicator** (e.g., `Viewing: Halal Framework (Default)`). Clicking this allows quick framework switching without leaving the page.
- **Universal "Deposit/Withdraw" Action** (Virtual funds).

---

## 6. High-Level Site Map

### 6.1 Guest (Unauthenticated) View
The goal is to provide immediate value through asset evaluation to drive conversion.

```text
[Landing Page] (Marketing/Value Prop)
 ├── [Search] -> Global Search Overlay
 └── [Asset Detail] (e.g., /assets/AAPL)
      ├── Chart & Market Data
      ├── Compliance Evaluation (Read-only, Default Framework)
      └── "Sign up to Trade" Interstitial (Intercepts trading actions)
```

### 6.2 Registered User View
The full operating system experience.

```text
[App Root] -> Redirects to /portfolio
 ├── /portfolio (Dashboard)
 │    ├── Overview (Performance & Aggregate Compliance)
 │    └── Holdings Table
 ├── /assets/[ticker] (The Core Loop)
 │    ├── Market Data (Chart, Key Stats)
 │    ├── Compliance Engine Output (Rule-by-rule breakdown)
 │    └── Order Ticket (Buy/Sell)
 ├── /watchlist
 ├── /frameworks (Compliance Engine Center)
 │    ├── Active Framework Selection
 │    ├── Custom Threshold Configuration
 │    └── Framework Comparison Tool
 └── /history
      ├── Order Executions
      └── Compliance Audit Log
```

---

## 7. URL Structure & Routing

The URL structure is designed to be clean, shareable, and directly mappable to the Next.js `app/` router.

| Route / Pattern | Purpose | Next.js Page Location |
|---|---|---|
| `/` | Marketing landing page | `app/(marketing)/page.tsx` |
| `/login`, `/register` | Auth flows | `app/(auth)/login/page.tsx` |
| `/portfolio` | User dashboard | `app/(app)/portfolio/page.tsx` |
| `/assets/[ticker]` | Asset evaluation & trading | `app/(app)/assets/[ticker]/page.tsx` |
| `/watchlist` | Saved assets | `app/(app)/watchlist/page.tsx` |
| `/frameworks` | Framework selection & config | `app/(app)/frameworks/page.tsx` |
| `/history` | Activity logs | `app/(app)/history/page.tsx` |
| `/settings` | User account | `app/(app)/settings/page.tsx` |

**SEO & Sharing Considerations:**
The `/assets/[ticker]` route is completely server-side rendered (SSR) or statically generated (SSG) with dynamic parameters to ensure that social sharing links unfurl beautifully with meta tags showing the asset's current compliance status.

---

## 8. Page Hierarchies & Layouts

### 8.1 The Asset Detail Page (`/assets/[ticker]`)
This is the most critical page in the application. It must balance three massive domains of information: Market Data, Compliance Rules, and Trade Execution.

**Layout Architecture (Desktop):**
- **Left Column (60% width): Market Data**
  - Header: Ticker, Name, Price, Daily Change.
  - Interactive Chart (TradingView Lightweight Charts).
  - Key Financials (P/E, Market Cap, Volume).
- **Right Column (40% width): Compliance & Execution**
  - **Top Half: The Compliance Card**
    - Verdict Header (e.g., ✅ Compliant).
    - Framework Selector (Dropdown to switch to ESG, etc.).
    - Expandable Rule List (The engine's evaluation output).
  - **Bottom Half: The Order Ticket**
    - Buy/Sell Toggle.
    - Order Type (Market/Limit).
    - Quantity/Value input.
    - Submit Button.

*Why this works:* The user's eye naturally moves from the chart (What is it doing?), to the Compliance Card (Should I buy it?), to the Order Ticket (I will buy it). It physically enforces the "Compliance-Aware Trading" paradigm.

### 8.2 The Portfolio Dashboard (`/portfolio`)
The portfolio isn't just about financial return; it's about compliance health.

**Layout Architecture:**
- **Hero Section:**
  - Total Virtual Balance & Daily PnL.
  - **Portfolio Compliance Score:** A visual gauge (e.g., 100% Compliant).
- **Holdings Table (Data Dense):**
  - Columns: Asset, Qty, Avg Price, Current Price, Return, **Compliance Status**.
  - Clicking an asset row opens a quick-view modal or navigates to the Asset Detail page.
- **Alerts Section:**
  - Warnings if a recent earnings report caused a holding to violate a framework threshold.

### 8.3 The Frameworks Center (`/frameworks`)
This is where the user configures the "Operating System".

**Layout Architecture:**
- **Active Framework Selector:** A visual carousel or list of available frameworks (Halal, ESG, Value).
- **Configuration Panel (Dynamic based on selected framework):**
  - For Halal: Sliders for Debt-to-Equity (Default 33%), Interest Income (Default 5%).
  - Reset to Scholarly Defaults button (e.g., "Reset to AAOIFI Standard").
- **Impact Preview:** A side-panel showing a mock portfolio and how the current threshold tweaks would alter its compliance.

---

## 9. Information Density & Progressive Disclosure

To prevent "Analysis Paralysis" (a key risk identified in `03-user-personas.md`), we use strict progressive disclosure patterns.

### Level 1: The Verdict (Immediate Glance)
- **What is shown:** A simple badge. Green ✅ (Compliant), Red ❌ (Non-Compliant), or Yellow ⚠️ (Warning / Nearing Threshold).
- **Where:** Holdings table, Watchlist, Search results.
- **Target Persona:** Amir (Beginner) needing quick reassurance.

### Level 2: The Summary (The Context)
- **What is shown:** The list of rules evaluated, showing pass/fail for each (e.g., Debt-to-Equity: Pass, Sector: Pass).
- **Where:** The default state of the Compliance Card on the Asset Detail page.
- **Target Persona:** Amir (learning the terminology) and Fatima (verifying the evaluation).

### Level 3: The Explanation (The Deep Dive)
- **What is shown:** The raw math and the educational context. (e.g., *Total Debt is $110B, Total Equity is $350B resulting in 31%. This is below your 33% threshold. Debt ratios matter because...*)
- **Where:** Hidden behind an accordion click on the specific rule within the Compliance Card.
- **Target Persona:** Fatima (auditing the math) and David (learning the financial theory).

---

## 10. Cross-Linking Strategy

To fulfill the "Teach Through Usage" principle, the IA heavily relies on contextual cross-linking rather than a static "Help Center".

- **Financial Terms:** Terms like "Market Cap" or "Debt-to-Equity" within the UI feature dotted underlines. Hovering/clicking opens a localized popover with an Investopedia-style definition, preventing the user from leaving the workflow.
- **Framework Comparisons:** On the Asset Detail page, if a stock fails the Halal Framework, a contextual link suggests: *"Curious? See how this scores under the ESG Framework."* This drives discovery of the multi-framework architecture.

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Primary Navigation** | Command Palette (Search First) | Deep categorizations (Sectors/Industries) | The universe of stocks is too large to browse efficiently via menus. A search-first approach reduces clicks to action from ~4 to 1. |
| **Compliance UI Placement** | Alongside the Order Ticket | Separate "Compliance" Tab | Separating compliance into a tab treats it as an afterthought. Placing it directly above the "Buy" button forces compliance-aware decision making. |
| **Dashboard Focus** | Combined PnL & Compliance | Pure Financial PnL | Treating the Portfolio Compliance Score as a first-class citizen alongside financial return reinforces the platform's core identity. |

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Mobile Layout Cramping** | High | The 2-column Desktop layout for the Asset Detail page will fail on mobile. **Mitigation:** Use a sticky bottom-sheet for the Order Ticket on mobile, allowing the user to scroll through the Chart and Compliance card independently above it. |
| **Command Palette Discoverability** | Medium | Beginners (Amir) might not understand the `Cmd+K` paradigm. **Mitigation:** Always render a visible, clickable "Search Assets..." bar in the header that triggers the palette, in addition to the keyboard shortcut. |

---

## 13. Future Expansion

| Feature | IA Impact | Phase |
|---|---|---|
| **Custom Framework Builder** | Adds a complex drag-and-drop rule builder to `/frameworks/new`. Requires expanding the Frameworks section into a dedicated management hub. | Phase 4 |
| **Purification Calculator** | Adds a new route `/portfolio/purification` to walk users through a multi-step calculation wizard based on their dividend history. | Phase 2 |

---

## 14. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Next.js App Router** | Technical | Dictates the file-based routing and layout nesting strategies detailed in Section 7. |
| **Component Library (`08-component-library.md`)** | Design | The IA dictates the *need* for components (e.g., Accordions for progressive disclosure, Command Palette), which the library must fulfill. |

---

## 15. Engineering Notes

- **Layout Nesting:** The Next.js implementation should utilize layout files effectively. `app/(app)/layout.tsx` should wrap the authenticated application, providing the Sidebar, Contextual Top Bar, and Global Command Palette context provider so they don't re-render on page navigation.
- **Data Fetching Parallelism:** The `/assets/[ticker]` route's layout requires fetching Market Data and Compliance Data simultaneously. Use Next.js `React.Suspense` boundaries to stream the Market Data chart instantly while the Compliance Engine completes its evaluation.

---

## 16. Recruiter Impact Notes

### 16.1 What This Document Demonstrates
- **Systems Thinking:** Shows how to organize a highly complex domain (financial data + compliance logic + trading execution) into an intuitive, approachable structure.
- **UX Maturity:** Demonstrates mastery of "Progressive Disclosure"—a critical concept for balancing the needs of power users (Fatima) and beginners (Amir) in the same interface.
- **Technical Empathy:** The routing schema proves an understanding of how IA directly translates into modern Next.js `app/` router file structures.

---

## 17. Business Impact Notes

- **Reduced Time-to-Value (TTV):** By employing a flat, search-first architecture, a new user can go from account creation to viewing a compliance evaluation on their favorite stock in seconds, minimizing drop-off.
- **Feature Discoverability:** Contextual cross-linking (e.g., suggesting an ESG evaluation on a Halal page) naturally drives users to interact with more of the platform's capabilities without relying on expensive marketing or push notifications.

---

## 18. Document Cross-References

| Document | Relationship |
|---|---|
| `04-user-journeys.md` | The journeys defined the need; this IA document defines the physical space where those journeys occur. |
| `07-page-inventory.md` | Expands on this IA by detailing the exact state requirements, SEO needs, and components for every route listed in Section 7. |
| `12-frontend-architecture.md` | Details the exact technical implementation (Next.js, Zustand) of the navigation paradigms defined here. |

---

> **End of Document**
>
> Changes to the URL structure or primary navigation paradigm must be reviewed by both Design and Frontend Engineering leads to ensure SEO and routing implications are addressed.
