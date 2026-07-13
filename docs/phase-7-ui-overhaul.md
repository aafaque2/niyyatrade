# Phase 7 — UI Overhaul & Production Polish

> **Objective:** Transform the functional skeleton into a premium, polished financial application that looks institutional-grade (TradingView meets Linear meets Robinhood). Every page gets proper design, every component gets its required states, and the full design system is enforced.

---

## Overview of Current vs. Target State

| Aspect | Current | Target |
|---|---|---|
| **Landing Page** | Bare text + 3 buttons | Full hero with search mock, feature highlights, value prop |
| **Auth Pages** | Minimal forms | Google OAuth + email/password + guest flow |
| **Asset Page** | Skeleton layout with chart + compliance + trade | Full asset detail: header with price/change, chart with timeframes, stats, compliance card with framework selector, order ticket with market/limit |
| **Portfolio** | Summary cards + table | Hero metrics, compliance score gauge, holdings table with badges, activity feed |
| **Frameworks** | Empty placeholder | Framework cards with visual selector, threshold sliders |
| **Watchlist** | Empty placeholder | Full data table with add symbol, compliance badges |
| **History** | Empty placeholder | Orders + Compliance Audit tabs |
| **Settings** | Framework override form only | Full settings: profile, password, reset portfolio, notifications |
| **Design** | Generic shadcn defaults | Custom design tokens, monospace numbers, proper color system, skeleton loaders, empty/error states, toasts, tooltips |
| **Mobile** | Not responsive | Mobile layout with sticky bottom sheet for trading, responsive tables |

---

## Phase 7.1 — Foundational UI Architecture

**Goal:** Set up the design tokens, fonts, and base components that everything else builds on.

### Tasks

1. **Install fonts**
   - Add `@fontsource/inter` and `@fontsource/jetbrains-mono` (or `next/font`)
   - Configure Inter as primary sans-serif, JetBrains Mono as monospace for all financial numbers
   - Apply monospace globally to all price/quanity display elements via a CSS class

2. **Enforce design tokens in globals.css**
   - Set `--background: 240 10% 3.9%` (zinc-950), `--surface: 240 4% 16%` (zinc-800)
   - Set semantic tokens compliant/success (emerald), non-compliant/danger (rose), warning (amber), insufficient data (slate)
   - Set primary action (indigo-500)
   - Add "dimmed" variants for large area fills (10% opacity semantic colors)
   - Set border color to `--border: 240 4% 16%` (zinc-800) for subtlety

3. **Create a shared number formatting utility**
   - `formatCents(cents): string` — with monospace tabular nums
   - `formatPercent(value): string`
   - `formatQuantity(value): string`
   - All must use `font-mono` class output

4. **Build base page layout wrapper**
   - Responsive sidebar (collapsible on mobile)
   - Top nav with search bar, notifications bell, user menu
   - Main content area with proper max-width container
   - Breadcrumb component for deep pages

5. **Add toast notification system**
   - Install `sonner` for toast notifications
   - Wire toasts for: order execution success/failure, compliance changes, errors
   - Create `useToast` hook

6. **Build reusable empty-state, error-state, and loading-skeleton components**
   - `EmptyState` — icon + message + CTA button
   - `ErrorState` — error icon + message + retry button
   - `PageSkeleton` — full-page skeleton matching layout
   - `DataCardSkeleton`, `TableSkeleton`, `ChartSkeleton`

7. **Add educational tooltip system**
   - Build a `InfoTooltip` component wrapping shadcn `Tooltip`
   - Use on financial terms: "Debt-to-Equity", "Market Cap", "P/E Ratio", etc.
   - Content comes from a `FINANCIAL_GLOSSARY` constant map

### Files to Create/Modify
- `frontend/src/app/globals.css` — overhaul with full design tokens
- `frontend/src/app/layout.tsx` — add font loading, toaster provider
- `frontend/src/lib/utils.ts` — add formatCents, formatPercent, formatQuantity
- `frontend/src/components/ui/empty-state.tsx` — NEW
- `frontend/src/components/ui/error-state.tsx` — NEW
- `frontend/src/components/ui/page-skeleton.tsx` — NEW
- `frontend/src/components/ui/info-tooltip.tsx` — NEW
- `frontend/src/components/ui/skeleton.tsx` — enhance
- `frontend/src/providers/toast-provider.tsx` — NEW
- `frontend/src/lib/constants/glossary.ts` — NEW

---

## Phase 7.2 — Landing Page Overhaul

**Goal:** A premium, conversion-focused marketing landing page.

### Design Requirements
- Dark mode default ($09090B background)
- Hero with tagline: "The Compliance-Aware Investing Operating System"
- Interactive search bar mock — type a ticker → navigates to `/assets/[ticker]` (guest)
- Feature highlight cards: Pluggable Frameworks, Paper Trading, Explainability, Real-time Data
- Each feature card has subtle icon + heading + description + hover effect (150ms ease)
- Bottom CTA section with "Get Started" / "Try Trading Now" buttons
- Footer with links to Login, Register, Terms (placeholder)

### Elements
- **Hero section**: Large heading, subheading, search bar, CTA buttons
- **Features grid**: 3-4 feature cards with icons (use lucide-react)
- **Stats bar**: "X Frameworks", "Y Assets Tracked", "Z Paper Traders" (animated counters optional)
- **Footer**: Minimal links

### Files
- `frontend/src/app/page.tsx` — full rewrite
- `frontend/src/components/landing/hero-section.tsx` — NEW
- `frontend/src/components/landing/feature-card.tsx` — NEW
- `frontend/src/components/landing/search-bar.tsx` — NEW
- `frontend/src/components/layout/footer.tsx` — NEW

---

## Phase 7.3 — Auth Pages Redesign

**Goal:** Polished login/register with Google OAuth + email/password + guest flow.

### Design
- Centered card layout on dark background
- Google OAuth button as primary (large, with Google logo)
- Divider "or" with horizontal lines
- Email/password form as secondary
- "Continue as Guest" link at bottom
- Social proof text: "Join X,XXX compliance-conscious investors"

### Login Page (`/login`)
- Email + password inputs with proper validation states
- Error message for invalid credentials
- Loading state on submit button
- Link to register

### Register Page (`/register`)
- Name + Email + Password + Confirm Password
- Password strength indicator (optional)
- Success → redirect to portfolio with auto-created portfolio

### Files
- `frontend/src/app/(auth)/login/page.tsx` — redesign
- `frontend/src/app/(auth)/register/page.tsx` — redesign
- `frontend/src/components/auth/google-button.tsx` — NEW
- `frontend/src/components/auth/divider.tsx` — NEW

---

## Phase 7.4 — Asset Detail Page (The Core Loop)

**Goal:** The single most important page in the app — a polished, data-rich asset evaluation and trading hub.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  AAPL  │  Apple Inc.  │  $178.32  │  ▲ +2.1% Today     │
├──────────────────────────────┬──────────────────────────┤
│                              │  ┌────────────────────┐  │
│     [Chart]                  │  │  Compliance Card   │  │
│     Timeframes: 1D 1W 1M 1Y │  │  Framework: [▼AAOIFI]│  │
│                              │  │  Verdict: ✅ Halal   │  │
│                              │  │  ┌─ Debt Ratio ──┐  │  │
│                              │  │  │ 31% < 33% Pass│  │  │
│                              │  │  └────────────────┘  │  │
│                              │  ├────────────────────┤  │
│                              │  │   Order Ticket      │  │
│                              │  │   [BUY] [SELL]      │  │
│                              │  │   Qty: [____]       │  │
│                              │  │   Est: $1,234.56    │  │
│                              │  │   [Submit Order]    │  │
│                              │  └────────────────────┘  │
│                              │  ┌────────────────────┐  │
│  ┌────────────────────────┐  │  │  Key Statistics    │  │
│  │ Market Cap │ $2.8T     │  │  │  P/E     │ 32.4    │  │
│  │ Div Yield │ 0.5%      │  │  │  Volume  │ 52M     │  │
│  └────────────────────────┘  │  └────────────────────┘  │
├──────────────────────────────┴──────────────────────────┤
│  Compare Frameworks  │  View in Watchlist  │  Full Report │
└─────────────────────────────────────────────────────────┘
```

### Elements

#### Header Section
- Ticker + company name + current price (large, bold, monospace)
- Daily change (green/red with arrow)
- A "Compare Frameworks" button in header

#### Chart Section (left column, 3/5 width)
- TradingView Lightweight Charts with timeframe selector (1D, 1W, 1M, 1Y, ALL)
- Dark theme matching design system
- Responsive — fills container width, 400px height
- Loading: ChartSkeleton
- Error: "Chart data unavailable" message
- Empty: N/A (charts always have data or error)

#### Compliance Card (right column, 2/5 width)
- Framework selector dropdown (active framework)
- Overall verdict badge: ✅ Halal (emerald) / ❌ Not Halal (rose) / ⚠️ Warning (amber) / Insufficient Data (slate)
- Rule accordion: each rule shows status icon + name + value vs threshold
- Expanded rule shows explanation text (dimmed)
- Loading: Skeleton matching card height
- Error: "Failed to load compliance data" + retry
- Insufficient Data state: gray/slate message

#### Order Ticket (right column)
- BUY/SELL toggle tabs
- Market/Limit toggle (limit optional for MVP)
- Quantity input (supports fractional shares, step 0.0001)
- Estimated cost/proceeds display (monospace)
- Submit button with loading state
- Success: green toast "Order executed!"
- Error: red error message inline
- Guest: clicking Buy opens LoginDialog (already implemented)

#### Key Statistics Section (below chart, right column)
- Market Cap, P/E Ratio, Dividend Yield, Volume, 52W High/Low
- All numbers in monospace
- Loading: skeleton row
- Error: "Stats unavailable"

#### Bottom Action Bar
- Compare Frameworks button (opens modal)
- Add to Watchlist toggle button
- View Full Report (placeholder link)

### Data Fetching
- Chart candles: `GET /market-data/{ticker}/candles?resolution=1M`
- Quote: `GET /market-data/{ticker}/quote`
- Fundamentals: `GET /market-data/{ticker}/fundamentals`
- Compliance: `GET /compliance/evaluate?ticker={ticker}`
- All fetched in parallel via TanStack Query
- Candle resolution changes trigger new query

### States
| State | Behavior |
|---|---|
| **Loading** | ChartSkeleton for chart area, CardSkeleton for compliance + order ticket |
| **Error (Chart)** | Show compliance + order ticket normally, chart area says "Chart unavailable" |
| **Error (Compliance)** | Show chart + order ticket, compliance card shows "Failed to load" with retry |
| **Error (Quote)** | Order ticket shows "Price unavailable", disables submit |
| **Empty** | Not applicable for this page |

### Files to Create/Modify
- `frontend/src/app/(app)/assets/[ticker]/page.tsx` — rewritten with full layout
- `frontend/src/components/compliance/compliance-card.tsx` — enhanced with framework selector, all states
- `frontend/src/components/compliance/rule-accordion.tsx` — enhanced with status icons, explanation
- `frontend/src/components/trading/order-ticket.tsx` — enhanced with market/limit toggle, better states
- `frontend/src/components/charts/asset-chart.tsx` — enhanced with timeframe selector, responsive resize
- `frontend/src/components/charts/chart-timeframe.tsx` — NEW
- `frontend/src/components/asset/asset-header.tsx` — NEW
- `frontend/src/components/asset/key-stats.tsx` — NEW
- `frontend/src/components/asset/framework-selector.tsx` — NEW
- `frontend/src/lib/hooks/use-fundamentals.ts` — NEW

---

## Phase 7.5 — Portfolio Dashboard Redesign

**Goal:** A comprehensive dashboard showing financial health and compliance alignment at a glance.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Portfolio                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────────────┐ │
│  │$142K │ │$100K │ │ 92%  │ │   Compliance       │ │
│  │Total │ │Power │ │Score │ │   Gauge (visual)    │ │
│  └──────┘ └──────┘ └──────┘ └────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Holdings Table                                │   │
│  │ Ticker │ Qty │ Avg │ Price │ Return │ Compl. │   │
│  │ AAPL   │ 10  │ 170 │ $178  │ +4.7%  │ ✅     │   │
│  │ TSLA   │ 5   │ 240 │ $235  │ -2.1%  │ ❌     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │ Recent Activity    │  │ Top Holdings       │     │
│  │ Bought AAPL 2h ago│  │ AAPL — $1,780      │     │
│  │ Sold MSFT yesterday│  │ TSLA — $1,175      │     │
│  └────────────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Elements
- **Hero metric cards**: Total Value, Buying Power, Compliance Score
- **Compliance gauge**: Visual circular gauge or bar showing portfolio compliance percentage
- **Holdings table**: Full data table with monospace numbers, compliance badges, clickable rows → asset page
- **Recent activity feed**: Last 5 transactions with time ago, ticker, action, amount
- **Top holdings sidebar**: Pie/bar chart or ranked list of top positions by value

### States
| State | Behavior |
|---|---|
| **Loading** | Metric card skeletons, table skeleton, activity skeleton |
| **Empty** | "Your portfolio is empty. Search for an asset to place your first paper trade." + CTA button to search |
| **Error** | "Failed to load portfolio" + retry button |

### Files
- `frontend/src/app/(app)/portfolio/page.tsx` — full rewrite
- `frontend/src/components/portfolio/portfolio-summary.tsx` — enhance metric cards
- `frontend/src/components/portfolio/portfolio-table.tsx` — enhance with compliance badges, clickable rows
- `frontend/src/components/portfolio/compliance-gauge.tsx` — NEW
- `frontend/src/components/portfolio/activity-feed.tsx` — NEW
- `frontend/src/components/portfolio/top-holdings.tsx` — NEW

---

## Phase 7.6 — Framework Configuration Center

**Goal:** A visual framework selector and threshold customizer.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Framework Configuration                             │
│                                                      │
│  Active Framework:                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ ✅ AAOIFI    │ │   ESG        │ │   Custom      ││
│  │   Halal      │ │   Standard   │ │   Halal       ││
│  │   Default    │ │   (Coming)   │ │   (Coming)    ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                      │
│  Threshold Overrides                                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ Maximum Debt-to-Equity Ratio                  │   │
│  │ [33% ──────────────○─────────] 30%           │   │
│  │ Current: 33%  │  Override: 30%               │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Maximum Interest Income Ratio                 │   │
│  │ [5% ───○──────────────────────] 3%           │   │
│  │ Current: 5%   │  Override: 3%                │   │
│  ├──────────────────────────────────────────────┤   │
│  │ [Save Changes]  [Reset to Defaults]          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Impact Preview                                      │
│  "With these thresholds, 3 of 5 portfolio            │
│   holdings would remain compliant."                  │
└─────────────────────────────────────────────────────┘
```

### Elements
- **Framework cards**: Visual cards with icon, name, description, "Active" badge
- **Threshold sliders**: shadcn Slider component for each adjustable threshold
- **Current vs Override labels**: Show original and custom values
- **Save / Reset buttons**: Save triggers PUT /users/me/framework-prefs
- **Impact preview**: Shows how changes affect your portfolio (optional insight text)

### States
| State | Behavior |
|---|---|
| **Loading** | Card skeletons, slider skeletons |
| **Empty** | "No frameworks available" (unlikely) |
| **Error** | "Failed to load frameworks" + retry |
| **Save success** | Toast "Framework preferences updated" |
| **Save error** | Toast "Failed to save" with error |

### Files
- `frontend/src/app/(app)/frameworks/page.tsx` — full rewrite
- `frontend/src/components/frameworks/framework-card.tsx` — NEW
- `frontend/src/components/frameworks/threshold-slider.tsx` — NEW
- `frontend/src/components/frameworks/impact-preview.tsx` — NEW

---

## Phase 7.7 — Watchlist

**Goal:** A live dashboard of tracked assets with compliance status at a glance.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Watchlist                              [+ Add]     │
│                                                      │
│  ┌─────┬────────┬────────┬────────┬────────┬──────┐ │
│  │     │ Price  │ Change │ Volume │ Compl. │      │ │
│  │ AAPL│ $178.32│ +2.1%  │  52M   │ ✅     │ [×] │ │
│  │ TSLA│ $235.10│ -1.2%  │  98M   │ ❌     │ [×] │ │
│  │ MSFT│ $332.50│ +0.8%  │  22M   │ ⚠️     │ [×] │ │
│  └─────┴────────┴────────┴────────┴────────┴──────┘ │
│                                                      │
│  [Search and add symbols...]                         │
└─────────────────────────────────────────────────────┘
```

### Elements
- **Add symbol input**: Inline input with autocomplete search
- **Data table**: Ticker, Price, Daily Change, Volume, Compliance Badge, Remove button
- **Remove button**: X icon removes from watchlist with confirmation toast
- **Click row**: Navigates to `/assets/[ticker]`

### States
| State | Behavior |
|---|---|
| **Loading** | Table skeleton |
| **Empty** | "Your watchlist is empty. Search for assets to track." + search CTA |
| **Error** | "Failed to load watchlist" + retry |

### Files
- `frontend/src/app/(app)/watchlist/page.tsx` — full rewrite
- `frontend/src/components/watchlist/watchlist-table.tsx` — NEW
- `frontend/src/components/watchlist/add-symbol.tsx` — NEW

---

## Phase 7.8 — History Page

**Goal:** A comprehensive audit trail of orders and compliance changes.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  History                              [Orders] [Compliance] │
│                                                      │
│  ┌──────┬────────┬────────┬────────┬────────┬──────┐ │
│  │ Date │ Ticker │ Action │ Qty    │ Price  │ Total│ │
│  │ 7/12 │ AAPL   │ BUY    │ 10     │ $178   │$1,780│ │
│  │ 7/11 │ TSLA   │ SELL   │ 5      │ $235   │$1,175│ │
│  └──────┴────────┴────────┴────────┴────────┴──────┘ │
│                                                      │
│  Compliance Tab:                                     │
│  ┌──────┬────────┬────────────┬──────────┬─────────┐│
│  │ Date │ Ticker │ Status     │ Framework│ Reason  ││
│  │ 7/12 │ AAPL   │ COMPLIANT  │ AAOIFI   │ Passed  ││
│  │ 7/11 │ TSLA   │ NON-COMPL. │ AAOIFI   │ Debt>33%││
│  └──────┴────────┴────────────┴──────────┴─────────┘│
└─────────────────────────────────────────────────────┘
```

### Elements
- **Tabs**: "Orders" and "Compliance" using shadcn Tabs
- **Orders table**: Monospace numbers, colored buy (green) / sell (rose) badges
- **Compliance table**: Status badges, reason text
- **Pagination**: If > 20 items

### States
| State | Behavior |
|---|---|
| **Loading** | Table skeleton |
| **Empty (Orders)** | "No orders yet. Start trading to see your history." |
| **Empty (Compliance)** | "No compliance changes recorded yet." |
| **Error** | "Failed to load history" + retry |

### Files
- `frontend/src/app/(app)/history/page.tsx` — full rewrite
- `frontend/src/components/history/orders-table.tsx` — NEW
- `frontend/src/components/history/compliance-table.tsx` — NEW

---

## Phase 7.9 — Settings Page

**Goal:** Full account management with portfolio reset capability.

### Elements
- **Profile section**: Name, email (read-only or editable)
- **Password change**: Current password + new password + confirm
- **Framework overrides**: (existing component, relocated)
- **Reset portfolio**: "Reset Virtual Portfolio" button with confirmation dialog
  - Warning text: "This will reset your balance to $100,000 and clear all positions. This cannot be undone."
  - Confirm button in destructive red

### States
| State | Behavior |
|---|---|
| **Loading** | Card skeletons |
| **Error** | "Failed to load profile" + retry |
| **Save success** | Toast |
| **Reset success** | Toast + redirect to portfolio |

### Files
- `frontend/src/app/(app)/settings/page.tsx` — full rewrite
- `frontend/src/components/settings/profile-form.tsx` — NEW
- `frontend/src/components/settings/password-form.tsx` — NEW
- `frontend/src/components/settings/reset-portfolio-dialog.tsx` — NEW

---

## Phase 7.10 — Global UI Features

**Goal:** Polish that makes the app feel production-grade.

### 10.1 Command Palette Polish
- Proper keyboard shortcut handler (Cmd+K / Ctrl+K)
- A visual overlay with search results
- Categories: "Assets" (from API), "Navigation" (pages), "Actions" (framework switch)
- Loading state while searching
- Empty state: "No results found"
- Close on Escape, click outside

### 10.2 Auth Intercept Modal (Next.js Intercepting Routes)
- Use Next.js `(.)login` intercepting route pattern
- When a guest clicks "Buy" on asset page, show login modal over the asset page
- On successful login, return to the asset page in logged-in state
- Modal should preserve the context (the asset page visible behind it)

### 10.3 Framework Comparison Modal
- Trigger from "Compare Frameworks" button on asset detail page
- Shows side-by-side compliance results for AAOIFI vs ESG (future)
- For MVP: show AAOIFI vs a toggle-able second framework

### 10.4 Toast Notifications
- Order executed successfully (green)
- Order failed (red)
- Watchlist item added/removed
- Framework preferences saved
- Settings updated
- Portfolio reset

### 10.5 Error Boundaries
- Wrap each page section in React ErrorBoundary
- Catch rendering errors gracefully
- Show "Something went wrong" with retry button

### 10.6 Mobile Responsiveness
- Sidebar collapses to hamburger menu
- Tables horizontally scrollable
- Asset page: compliance card + order ticket collapse to accordion or bottom sheet
- Order ticket becomes sticky bottom sheet on mobile (like Robinhood)
- Touch-friendly input sizes (min 44px tap targets)

---

## Phase 7.11 — Backend Complements

**Goal:** Backend work needed to support the frontend enhancements.

### Tasks

1. **Watchlist CRUD endpoints**
   - `POST /watchlist` — add ticker
   - `DELETE /watchlist/{ticker}` — remove ticker
   - `GET /watchlist` — list with current prices + compliance badges

2. **History endpoints**
   - `GET /history/orders` — paginated order history with portfolioId filter
   - `GET /history/compliance` — compliance audit log (if stored)

3. **Fundamentals endpoint verification**
   - Ensure `GET /market-data/{ticker}/fundamentals` returns: marketCap, peRatio, dividendYield, volume, week52High, week52Low, sector, industry

4. **Portfolio reset endpoint**
   - `POST /portfolio/reset` — clears positions, sets cash to 10000000 cents
   - Protected by JWT, only resets own portfolio
   - Requires confirmation flag in body

5. **Watchlist module**
   - New `WatchlistModule` with service + controller
   - Or add to existing module

6. **Compliance caching in Redis**
   - Cache evaluation reports with TTL
   - Invalidate on framework override changes

### Files to Create/Modify
- `backend/src/modules/watchlist/` — NEW (service, controller, module)
- `backend/src/modules/history/` — NEW (service, controller, module)
- `backend/src/modules/trading/trading.controller.ts` — add POST /portfolio/reset
- `backend/src/modules/compliance/compliance.service.ts` — add Redis caching
- `backend/prisma/schema.prisma` — verify indexes for history queries

---

## Phase 7.12 — Error Pages & Polish

**Goal:** Custom 404, 500, and edge case pages.

### 404 Page
- Illustration or icon
- "Page not found"
- "The page you're looking for doesn't exist."
- Buttons: "Go to Portfolio" / "Search assets"

### 500 Page
- Illustration or icon
- "Something went wrong"
- "Our team has been notified."
- Button: "Try again" / "Go to Portfolio"

### Files
- `frontend/src/app/not-found.tsx` — NEW
- `frontend/src/app/error.tsx` — NEW

---

## Implementation Order (Recommended Sprint)

| Sprint | Phase | Description | Impact |
|---|---|---|---|
| 1 | 7.1 + 7.10 | Foundation: fonts, tokens, utils, toasts, skeletons, empty/error states | Enables everything else |
| 2 | 7.2 + 7.3 | Landing page + Auth pages | First impression + conversion |
| 3 | 7.4 | Asset Detail Page (full) | Core product experience |
| 4 | 7.5 | Portfolio Dashboard | User retention |
| 5 | 7.6 + 7.7 | Frameworks + Watchlist | Configurability + tracking |
| 6 | 7.8 + 7.9 | History + Settings | Completeness |
| 7 | 7.11 + 7.12 | Backend endpoints + Error pages | Infrastructure |
