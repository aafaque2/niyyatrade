# NiyyaTrade — Trade with Intention. Invest with Ethics.

> A compliance-aware paper-trading platform. Simulate real portfolios with real market data, and have every trade evaluated against pluggable, explainable ethical frameworks — Halal (AAOIFI), ESG/Ethical, and Standard.

[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black)](./frontend)
[![Backend](https://img.shields.io/badge/backend-NestJS%2011-red)](./backend)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2016-blue)](./docker-compose.yml)
[![Cache](https://img.shields.io/badge/cache-Redis%207-red)](./docker-compose.yml)
[![TypeScript](https://img.shields.io/badge/language-TypeScript%205-3178c6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)](#license)

---

## Table of Contents

- [Start here — pick your lens](#start-here--pick-your-lens)
- [1. What is NiyyaTrade?](#1-what-is-niyyatrade)
- [2. Why it matters](#2-why-it-matters)
- [3. Feature tour](#3-feature-tour)
- [4. Core IP I — Compliance Framework Engine](#4-core-ip-i--compliance-framework-engine)
- [5. Core IP II — Paper-Trading Engine](#5-core-ip-ii--paper-trading-engine)
- [6. Market-Data System](#6-market-data-system)
- [7. Architecture](#7-architecture)
- [8. Tech stack](#8-tech-stack)
- [9. Database design](#9-database-design)
- [10. API reference](#10-api-reference)
- [11. Frontend tour](#11-frontend-tour)
- [12. Security, observability & performance](#12-security-observability--performance)
- [13. Getting started](#13-getting-started)
- [14. Development workflows](#14-development-workflows)
- [15. Deployment](#15-deployment)
- [16. Product & business model](#16-product--business-model)
- [17. For recruiters](#17-for-recruiters)
- [18. For founders](#18-for-founders)
- [19. Documentation index](#19-documentation-index)
- [20. Roadmap](#20-roadmap)
- [21. Contributing](#21-contributing)
- [22. Disclaimer & license](#22-disclaimer--license)

---

## Start here — pick your lens

| If you are a… | Read this first | What you'll see |
|---|---|---|
| **Recruiter / hiring manager** | [§17 For recruiters](#17-for-recruiters) → [§4 Compliance Engine](#4-core-ip-i--compliance-framework-engine) → [§7 Architecture](#7-architecture) | Staff-level system design, fintech rigor, modern React, and 32 design docs proving written communication. |
| **Founder / investor** | [§2 Why it matters](#2-why-it-matters) → [§16 Product & business model](#16-product--business-model) → [§18 For founders](#18-for-founders) | Underserved $4.5T Islamic-finance market, defensible plugin moat, freemium + B2B API economics at ~$0.035/user/mo. |
| **Developer** | [§7 Architecture](#7-architecture) → [§13 Getting started](#13-getting-started) → [§9 Database design](#9-database-design) → [§10 API reference](#10-api-reference) | Modular NestJS monolith, Next.js 16 App Router, Prisma 7 + Postgres, Redis caching, Zod anti-corruption layer. |

**The 10-minute test:** search a stock → switch frameworks → read a rule-by-rule compliance explanation → place a paper trade → watch the portfolio update. If the Compliance Engine isn't the most memorable part, this README failed.

---

## 1. What is NiyyaTrade?

Most paper-trading simulators teach mechanics: click buy, watch a number go up. NiyyaTrade teaches **thinking**.

Every investing action flows through a **Compliance Framework Engine** — a pluggable, compiler-style pipeline that evaluates a stock against real investment frameworks, does the math at runtime, and explains itself in plain English:

> "Trade **rejected**" → *"Trade flagged because Total Debt ($110B) ÷ 12-mo avg Market Cap ($2.5T) = 4.4%, vs. your Halal threshold of 33.33%… here's what that means and what to watch."*

### Positioning

| Dimension | Typical simulators | NiyyaTrade |
|---|---|---|
| Trade execution | Place order → see result | Place order → evaluate against framework → explain decision → execute → show reasoning |
| Education | Separate "Learn" tab with articles | Embedded, contextual, decision-specific — you can't trade without learning |
| Compliance | None, or a boolean `is_halal` flag | Multi-framework, configurable, explainable, fully audited |
| Frameworks | None | Pluggable engine — add ESG, Value, or Custom without touching engine, API, or UI |
| Transparency | "Trade rejected" | Rule ID, threshold, actual value, data source, severity, recommendation, audit trail |

### What it is / is not

- **Is:** a virtual investing OS — simulation + financial analysis + embedded education + pluggable evaluation + transparent decisions.
- **Is not:** a broker (no real money, no order routing, no license), a crypto exchange, a day-trading terminal, or a religious website. The platform is secular technology; Halal is one flagship framework among many.

---

## 2. Why it matters

1. **Underserved market.** ~$4.5T in global Islamic-finance assets, plus a large ESG-conscious investor base, with no simulator offering transparent, explainable Shariah screening. Word-of-mouth potential is high.
2. **Commodity trap avoided.** Virtual orders, charts, and portfolio tables are table stakes. The moat is the **"why" layer**: rule-by-rule explanations with audit trails.
3. **Trust is the product.** In ethics-driven investing, a false "Compliant" verdict is worse than a crash. The engine fails closed to `INSUFFICIENT_DATA` rather than guessing (see §4).
4. **Architecture compounds.** JSONB-driven rule configs, framework-agnostic UI contracts, and bounded contexts mean new frameworks (ESG, Dividend, Value, Custom) ship as data + 2–3 classes, not rewrites.

Design influences (studied, never cloned): TradingView (density), Zerodha Kite (simplicity), Groww (onboarding), Robinhood (delight), Linear (keyboard-first Cmd+K), Stripe (tables), Vercel (dark mode craft).

---

## 3. Feature tour

### Compliance & frameworks
- **3 frameworks out of the box:** `Standard` (no filters), `Ethical/ESG` (sector bans + data-coverage warnings), `Halal AAOIFI` (debt, receivables, interest-income ratios + industry exclusions).
- **Per-asset evaluation** with verdicts: `COMPLIANT` / `NON_COMPLIANT` / `PARTIALLY_COMPLIANT` / `INSUFFICIENT_DATA`, overall 0–1 score, per-rule pass/fail, human-readable explanations, recommendations, educational notes.
- **Framework switching** with instant re-evaluation; **user overrides** for custom thresholds (e.g., debt ÷ Total Assets at 30% instead of ÷ Market Cap at 33.33%).
- **Compliance history:** every evaluation persisted as a `ComplianceAudit` (inputs, outputs, framework version, timestamp).
- **Portfolio compliance score** aggregated across positions.

### Paper trading
- **$100,000 virtual cash** on signup (`availableCashCents` as `BIGINT` cents).
- **Market + limit orders** with `PENDING → EXECUTED / FAILED / CANCELLED` lifecycle, 2.5s order-watcher polling, expiry handling.
- **Fractional shares** via `DECIMAL(15,6)` + `decimal.js` — no floating-point dust.
- **ACID ledger:** volume-weighted average cost basis, immutable `Transaction` rows, reconstructable history for statements/tax later.
- **Short-sell guard** for Halal mode; cross-currency trades with FX conversion (no balance corruption).

### Market data & portfolio
- **Real-time-ish quotes + candles + search** across NASDAQ, NYSE, NSE, BSE, LSE and more, with `ExchangeBadge` and `MarketStatusBadge` (Open / Closed / Pre / After-hours).
- **Multi-currency portfolios** (USD base + user currency) via daily `FxDailyRate` snapshots with stale-cache fallback.
- **Watchlists**, asset pages with `AssetHeader`, `KeyStats`, TradingView Lightweight Charts, `ComplianceCard` + `RuleAccordion`.
- **Dashboard:** P&L (realized/unrealized), positions table, diversification at a glance.

### UX & platform
- **Keyboard-first:** Cmd+K command palette (Linear-style), route prefetching, optimistic updates.
- **Responsive, dark-mode-ready,** skeleton screens (no >300ms spinners on core flows), empty/error states designed, not afterthoughts.
- **Auth:** email/password + JWT (access + refresh with `tokenVersion` revocation), password reset via Resend, Google OAuth button scaffolded (backend strategy pending — see Roadmap).
- **SEO + a11y:** sitemap/robots/OG tags, semantic HTML, Radix/shadcn primitives.

---

## 4. Core IP I — Compliance Framework Engine

> Full spec: [`docs/14-compliance-engine.md`](./docs/14-compliance-engine.md)

The engine works like a **compiler**:

```mermaid
sequenceDiagram
    participant API as ComplianceController
    participant Core as EngineCore
    participant DB as Postgres (Frameworks)
    participant MD as MarketDataModule
    participant R1 as SectorRuleEvaluator
    participant R2 as FinancialRatioRuleEvaluator
    API->>Core: Evaluate("AAPL", userId)
    Core->>DB: Fetch Framework + User Overrides
    DB-->>Core: JSON config (e.g. Debt < 33.33%)
    Core->>MD: Get Fundamentals("AAPL")
    MD-->>Core: {sector, totalDebt, marketCap...}
    Core->>R1: Execute(config, fundamentals)
    R1-->>Core: RuleResult {passed, explanation}
    Core->>R2: Execute(config, fundamentals)
    R2-->>Core: RuleResult {passed, explanation}
    Core->>API: EvaluationReport (standard contract)
```

### Key design decisions

| Principle | How it's enforced |
|---|---|
| **Pluggable** | Every rule implements `IRuleEvaluator { getRuleId(), evaluate(fundamentals, config) }`. Engine instantiates via factory/DI from string IDs in DB. New framework = ~3 classes + 1 DB row. Zero changes to engine, API, or frontend. |
| **Configuration over code** | Thresholds live in `Framework.defaultRules` (JSONB) + per-user `FrameworkOverride.customThresholds` (JSONB, deep-merged). Non-engineers can tune without deploys. Versioned for auditability. |
| **Explainable** | Backend generates interpolated strings at runtime (`"Total debt $X ÷ $Y = Z%, vs. limit W%"`). Frontend stays dumb — renders the contract. Updating copy needs no frontend deploy. |
| **Auditable** | Every run writes `ComplianceAudit { verdict, rules JSON, evaluatedAt }`. Users can review full history. |
| **Safe degradation** | Missing upstream fields map to `null`, **never `0`**. A `null` forces `passed: null` → overall verdict `INSUFFICIENT_DATA` with *"Q3 Total Debt missing from provider"* messaging. No false Halal passes. |

### AAOIFI Halal defaults (MVP)

| Rule ID | Check | Formula | Default | Severity |
|---|---|---|---|---|
| `halal-industry` | Business-activity screen | `industry ∈ bannedSectors?` | Bans Alcohol, Gambling, Adult, Pork, Conventional Finance/Insurance, Defense (configurable) | CRITICAL |
| `halal-debt` | Leverage screen | `totalDebt / marketCap (TTM avg)` | ≤ 33.33% | CRITICAL |
| `halal-interest-income` | Purity of income | `interestIncome / totalRevenue` | ≤ 5.00% | CRITICAL |
| `halal-receivables` / `other-income` | Balance-sheet hygiene | `receivables / marketCap`, `non-compliant income / revenue` | ≤ 45% / ≤ 5% | CRITICAL / WARNING |

Example (AAPL): `COMPLIANT ✓, score 0.92` — Debt 0.30 ≤ 0.33 ✓, Receivables 1.8% ✓, Interest income ~1% ✓, Industry `Consumer Electronics` not excluded ✓, plus *"watch debt — 0.30 is close to 0.33"* and a note on the Hadith basis for the 33% rule.

### Why recruiters care

Domain mastery (AAOIFI + compiler pipelines + factory patterns), design for trust (`INSUFFICIENT_DATA`), and scalable architecture (Halal today, ESG tomorrow, custom user frameworks next — engine untouched).

---

## 5. Core IP II — Paper-Trading Engine

> Full spec: [`docs/15-paper-trading-engine.md`](./docs/15-paper-trading-engine.md)

Strictly isolated bounded context — it knows **quantities, prices, cash**. It knows nothing about `is_halal`. The UI warns; the engine executes math.

### Execution pipeline (`POST /portfolio/orders`)

1. **Validate:** qty > 0, ticker exists, buying power (`qty × price ≤ available_cash_cents`), ownership on sells (`position.qty ≥ order.qty`).
2. **Market-hours check:** if closed → `PENDING` + BullMQ/Redis delayed job for next 9:30 AM ET open; if open → execute now.
3. **Execute inside one Postgres transaction:**
   - `SELECT … FOR UPDATE` lock the `Portfolio` row
   - Fetch exact quote (**before** the lock where possible — never hold DB locks during network I/O)
   - `total = qty × price` → update cash → upsert `Position` → insert immutable `Transaction` → mark `Order EXECUTED` with price + timestamp

### Concurrency — the double-spend

Two simultaneous $1,000 buys on $1,000 cash: without locking both read $1,000 and both succeed → –$1,000 cash. Mitigation: **pessimistic row-level locking**. Thread 2 blocks at `FOR UPDATE` until Thread 1 commits, then re-reads $0 and fails cleanly. Chose pessimistic over optimistic because in ledgers, correctness beats retry-loop complexity.

### Precision — no floating-point money

- Currency: `BIGINT` cents everywhere (`$100.50` → `10050`). `0.1 + 0.2 !== 0.3` in IEEE 754 — unacceptable in ledgers.
- Quantities: `DECIMAL(15,6)` + `decimal.js` for all math; `Math.floor` to integer cents on totals.
- Cost basis: `NewAvg = ((OldQty × OldAvg) + (NewQty × ExecPrice)) / (OldQty + NewQty)`. Sells don't change average price.
- PnL: unrealized computed read-only (position avg vs. live quote); realized implicit in cash deltas; full history reconstructable from `transactions`.

---

## 6. Market-Data System

> Full spec: [`docs/16-market-data-system.md`](./docs/16-market-data-system.md)

### Multi-provider with graceful degradation

```
Yahoo Finance 2 (primary) → FMP (fallback) → Upstox (Indian equities NSE/BSE) → Mock (dev only, fail-fast in prod)
```

- **`MultiMarketDataProvider`** fans out search intelligently (Indian tickers prefer Upstox path), dedupes, normalizes to one DTO.
- **Anti-Corruption Layer:** every upstream payload validated by **Zod** before touching the domain. Schema changes upstream → instant alert, not silent mis-evaluation.
- **Redis caching:** quotes/candles/fundamentals cached (24h for compliance inputs); **stale-cache fallback** serves last-known-good on vendor outage; **request coalescing** prevents thundering herds (100 simultaneous AAPL requests → 1 upstream call).
- **Timeouts:** 10s fetch guards; `KEYS`-scan invalidation being migrated to `SCAN`/versioned keys.
- **FX service:** daily cron snapshots `FxDailyRate { date, base USD, rates JSON, source }` for multi-currency conversion with offline fallback.

Supported: NASDAQ / NYSE / NSE / BSE / LSE + more via Yahoo; INR via Upstox (note: token refresh is manual today — see Roadmap).

---

## 7. Architecture

### System overview

```mermaid
flowchart TB
    subgraph FE[Frontend - Next.js 16]
      Pages --> Query[TanStack Query] --> APIClient[Axios API client]
      Pages --> UIStore[Zustand UI store]
    end
    subgraph BE[Backend - NestJS Modular Monolith]
      Controllers --> Services --> Prisma
      Compliance[Compliance Engine] -.-> MarketData
      Trading[Trading Engine] -.-> MarketData
      Trading --> RedisQ[(Redis / BullMQ)]
    end
    APIClient -->|JWT + X-Request-ID| Controllers
    Prisma --> PG[(PostgreSQL 16)]
    MarketData --> Yahoo[Yahoo Finance 2]
    MarketData --> FMP[FMP]
    MarketData --> Upstox[Upstox]
    BE --> Sentry[Sentry + Pino logs]
    FE --> Sentry
```

**Why a modular monolith, not microservices?** A 1–3 person team can't run 4 services + K8s. NestJS modules + DI enforce bounded-context isolation in code, with clean extraction paths (e.g., lift Compliance into Go/Rust later if CPU-bound). Optimizes for startup speed + low infra cost without painting into a corner.

### Bounded contexts (DDD)

| Context | Owns | Never imports |
|---|---|---|
| User Identity | `User`, credentials, JWT, password reset, settings | Trading internals |
| Virtual Trading | `Portfolio`, `Position`, `Order`, `Transaction` | Halal/ESG logic |
| Compliance Engine | `Framework`, `FrameworkOverride`, `ComplianceAudit`, evaluators | Portfolio math |
| Market Data (+ FX) | Quotes, candles, fundamentals, FX rates, provider adapters | User/trading tables |

The `Portfolio` is deliberately **agnostic**: just `Positions`. Compliance happens at runtime, not storage — one decision enabling the whole multi-framework roadmap.

### Backend modules (`backend/src/modules/`)

| Module | Responsibility |
|---|---|
| `auth` | Register/login/refresh, JWT strategy with `tokenVersion` revocation, guards |
| `identity` | `/auth/me`, profile, password change, currency switching (with portfolio wipe) |
| `trading` | Orders, positions, transactions, `OrderWatcherService`, ledger math |
| `compliance` | Engine core, rule evaluators, overrides, audits |
| `market-data` | Providers (Yahoo/FMP/Upstox/Multi/Mock), Zod ACL, Redis cache |
| `fx` | Daily FX cron, conversion utilities |
| `portfolio` / `watchlist` / `history` / `asset` | Dashboard reads, watchlist CRUD, statements |
| `health` | `/health`, `/health/live`, `/health/ready` for Render/K8s |
| `mail` | Resend transactional email (password reset) |
| `prisma` / `redis` / `shared` | DI clients, interceptors, filters, middleware, utils |

Cross-cutting: `Helmet`, global `ValidationPipe`, Throttler rate limits, `X-Request-ID` propagation (frontend → API → jobs → logs), Swagger at `/docs`.

### Frontend architecture

- **"Leaves are Client":** page layouts stay React Server Components; `"use client"` pushed to interactive leaves (`OrderTicket`, charts).
- **State split:** TanStack Query v5 = server state (portfolio, quotes, compliance — caching, deduping, background refetch, invalidation on logout); Zustand = client UI state only (modals, filters). Redux explicitly rejected.
- **Suspense streaming:** Asset page wraps Chart + ComplianceCard in independent `<Suspense>` boundaries — parallel stream, no waterfall.
- **Imperative safety:** Lightweight Charts wrapped in `React.memo` + `useRef` + `useEffect` init with rigorous cleanup (no canvas memory leaks).
- **Security headers** via `middleware.ts`; Sentry tunnel fixed so client events actually arrive.

---

## 8. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 16.2.10** (App Router), **React 19.2.4** | RSC, SSR/SEO, file routing, prefetching, BFF routes |
| UI | **Tailwind CSS v4**, **shadcn/ui + Radix**, **Lucide**, **Sonner** | Token consistency, accessible primitives, premium craft |
| Data fetching | **TanStack Query v5**, **Axios**, **Zustand 5** | Cache/dedupe/refetch vs. minimal UI store |
| Charts | **TradingView Lightweight Charts 5** | Industry standard, light, themeable |
| Backend | **NestJS 11**, **TypeScript 5.7** | Modules + DI ideal for DDD monolith; end-to-end types |
| ORM / DB | **Prisma 7.8**, **PostgreSQL 16** | Type-safe access, migrations, ACID ledgers + JSONB configs |
| Cache / Jobs | **Redis 7**, **ioredis**, BullMQ-style watcher | Quotes, compliance cache, delayed order jobs |
| Market data | **yahoo-finance2 v4**, FMP, Upstox | Primary + fallback + India coverage |
| Auth | JWT (access + refresh, `tokenVersion` revocation), **bcryptjs**, passport-jwt | Stateless + instantly revocable on password change/reset |
| Validation | **Zod 4**, class-validator/transformer | Runtime safety at system boundaries |
| Observability | **Sentry 10.68** (FE+BE), **Pino** structured logs, health checks | Full error/log/health triad |
| Mail | **Resend** | Password-reset delivery |
| Math | **decimal.js** | Exact financial arithmetic |
| Testing | Jest 30 (BE), Playwright (FE e2e) | Unit + e2e |
| Infra | Docker Compose, Render (BE), Vercel (FE), GitHub Actions CI | Boring, cheap, scalable-enough |

---

## 9. Database design

> Full spec: [`docs/10-database-design.md`](./docs/10-database-design.md)

```mermaid
erDiagram
    User ||--o| Portfolio : has
    User ||--o{ Watchlist : owns
    User ||--o{ ComplianceAudit : runs
    User ||--o{ FrameworkOverride : customizes
    Portfolio ||--o{ Position : holds
    Portfolio ||--o{ Order : places
    Portfolio ||--o{ Transaction : settles
    Order ||--o| Transaction : produces
    Asset ||--o{ Position : listed_in
    Asset ||--o{ Order : traded_as
    Framework ||--o{ ComplianceAudit : evaluated_by
    Framework ||--o{ FrameworkOverride : tuned_by
    Watchlist ||--o{ WatchlistItem : contains
    Asset ||--o{ WatchlistItem : watched_in
```

Highlights:

- **Money as `BIGINT` cents** (`availableCashCents`, `targetPriceCents`, `executedPriceCents`, `pricePerShareCents`, `totalAmountCents`); **qty as `DECIMAL(15,6)`**; UUID PKs.
- **Hybrid relational + JSONB:** strict tables for ledgers (ACID), flexible `Framework.defaultRules` / `FrameworkOverride.customThresholds` / `ComplianceAudit.rules` / `FxDailyRate.rates` JSON for extensibility.
- **Enums:** `OrderSide {BUY, SELL}`, `OrderStatus {PENDING, EXECUTED, FAILED, CANCELLED}`, `TransactionType {BUY, SELL, DIVIDEND}` (dividends reserved — see Roadmap).
- **Indexes** on `(portfolioId, status)`, `(portfolioId, createdAt)`, `(userId, evaluatedAt)`, `(sector, exchange)` etc. for dashboard/search speed.
- Cash default `10000000` cents = $100,000 on signup.

---

## 10. API reference

Swagger/OpenAPI at **`/docs`** when backend runs (gate to non-prod recommended). Base path **`/api/v1`**.

| Domain | Method & path | Purpose |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | Create session, rotate JWT |
| Auth | `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` | Resend-based reset (bumps `tokenVersion`, revoking all sessions) |
| Identity | `GET /auth/me`, `PATCH /users/me`, `POST /users/change-password`, `POST /users/currency` | Profile, credentials, currency (wipes portfolio) |
| Market | `GET /market/search?q=`, `GET /market/quote/:ticker`, `GET /market/candles/:ticker?interval=` | Search, quote + marketStatus, OHLC |
| Compliance | `GET /compliance/evaluate/:ticker`, `GET /compliance/history`, `GET /frameworks`, `PATCH /frameworks/:id/overrides` | Evaluate, audit trail, list/switch/tune frameworks |
| Trading | `POST /portfolio/orders`, `GET /portfolio/orders`, `DELETE /portfolio/orders/:id` | Place/list/cancel orders |
| Trading | `GET /portfolio`, `GET /portfolio/positions`, `GET /portfolio/transactions`, `POST /portfolio/reset` | Dashboard, ledger, reset to $100k |
| Watchlist | `GET /watchlists`, `POST /watchlists`, `POST /watchlists/:id/items`, `DELETE …/items/:ticker` | CRUD + tickers |
| FX | `GET /fx/rates` | Daily snapshot for conversion |
| Health | `GET /health`, `GET /health/live`, `GET /health/ready` | Render probes + deploy checks |

Conventions: JWT Bearer (HttpOnly-ready), standardized error envelope (no internal leaks), throttling per-route, `X-Request-ID` echoed for traceability, pagination on lists.

---

## 11. Frontend tour

```
frontend/src/
├── app/
│   ├── page.tsx                  # Landing (hero, frameworks, CTA)
│   ├── (app)/                    # Authed shell: Sidebar + TopNav + Cmd+K
│   │   ├── dashboard/            # DashboardSummary + PortfolioTable + compliance rollup
│   │   ├── asset/[ticker]/       # AssetHeader + AssetChart + ComplianceCard + OrderTicket
│   │   ├── markets/              # Screener table with ExchangeBadge + MarketStatusBadge
│   │   ├── watchlist/            # WatchlistTable
│   │   ├── frameworks/           # FrameworkCard + FrameworkDetail + overrides
│   │   └── settings/             # Profile, framework, currency, password
│   ├── (auth)/login, register, reset-password/
│   ├── privacy/ terms/           # Static legal
│   └── sitemap.ts robots.ts opengraph-image.tsx
├── components/
│   ├── asset/ charts/ compliance/ framework/
│   ├── layout/ market/ portfolio/ trading/ auth/ ui/
├── lib/
│   ├── services/  # Axios client + typed API shapes
│   ├── hooks/     # React Query hooks (quoteKeys, searchKeys, portfolioKeys…)
│   └── utils.ts   # Currency/number formatters, FX helpers
├── providers/     # QueryClient, theme, toaster, Sentry
└── middleware.ts  # Security headers
```

Routes render framework-agnostically: `ComplianceCard` + `RuleAccordion` consume the standard `EvaluationReport` — no `if (halal)` branches in UI.

---

## 12. Security, observability & performance

**Security** ([`docs/17-security.md`](./docs/17-security.md)): bcrypt hashing, JWT + `tokenVersion` instant revocation, resource-ownership checks on every portfolio/order/watchlist row, 409-vs-enumeration tradeoff documented, Helmet + security headers, throttling, Zod at boundaries, `null`-not-`0` data hygiene, no secrets in repo (see `.env.example`).

**Observability** ([`docs/18-observability.md`](./docs/18-observability.md)): Sentry FE+BE, Pino JSON logs, `X-Request-ID` from client through API → jobs → logs (single-query debug), `/health/*` probes, PagerDuty-worthy alerts (API down, DB saturated) vs. Slack-next-day (single stale hit).

**Performance budgets:** nav <100ms perceived (prefetch), search <200ms to first result (debounce + cache), trade <300ms to confirm (optimistic), compliance <500ms (Redis), dashboard <400ms (indexed reads + pagination). Virtualized tables, memoized charts, code-split routes.

---

## 13. Getting started

### Prerequisites

- **Node.js ≥ 22**, **Docker** (Postgres + Redis), **npm**
- Optional: FMP key (fallback data), Upstox token (India), Sentry DSN, Resend key (password reset)

### Option A — Docker Compose (recommended)

```bash
# 1. Clone
git clone https://github.com/aafaque2/trading-platform.git
cd trading-platform

# 2. Start infra (Postgres 16 + Redis 7)
docker compose up -d

# 3. Backend
cd backend
cp .env.example .env
# Set DATABASE_URL=postgresql://niyyatrade:niyyatrade_dev@localhost:5432/niyyatrade
# Set REDIS_URL=redis://localhost:6379  +  JWT_SECRET (32+ chars)  +  FRONTEND_URL=http://localhost:3000
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev   # → http://localhost:4000/api/v1  ·  docs at /docs

# 4. Frontend (new terminal)
cd ../frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev         # → http://localhost:3000
```

`docker-compose.yml` ships `postgres_data` + `redis_data` volumes and healthchecks (`pg_isready`, `redis-cli ping`) — no manual DB setup.

### Option B — Manual infra

```bash
docker run -d --name niyyatrade-postgres -e POSTGRES_USER=niyyatrade -e POSTGRES_PASSWORD=niyyatrade_dev -e POSTGRES_DB=niyyatrade -p 5432:5432 postgres:16-alpine
docker run -d --name niyyatrade-redis -p 6379:6379 redis:7-alpine
```

### Environment variables

**Backend (`backend/.env`):**

| Var | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (add `?sslmode=require` on Render) |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | 32+ char signing secret |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `FRONTEND_URL` | Yes | CORS origin (must match Vercel URL in prod) |
| `PORT` | No | Default `4000` |
| `FMP_API_KEY` | No | Fallback market-data provider |
| `UPSTOX_ACCESS_TOKEN` | No | NSE/BSE quotes (manual daily refresh today) |
| `RESEND_API_KEY` / `MAIL_FROM` | No | Password-reset emails |
| `SENTRY_DSN` | No | Error tracking |
| `LOG_LEVEL` | No | Pino level, default `info` |

**Frontend (`frontend/.env.local`):**

| Var | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | e.g. `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for sitemap/OG |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Frontend error tracking |

> Never commit `.env` / `.env.local`. Rotate `JWT_SECRET` if ever exposed.

---

## 14. Development workflows

```bash
# Backend (from backend/)
npm run start:dev     # watch mode
npm run build && npm run start:prod
npm test              # Jest unit (RuleEvaluators demand 100%: happy, fail, edge-at-threshold, null-data)
npm run test:e2e      # Supertest API
npm run lint          # ESLint + Prettier
npx prisma studio     # DB browser
npx prisma migrate dev --name <change>
npm run prisma:seed   # Frameworks (AAOIFI, ESG, Standard) + demo data

# Frontend (from frontend/)
npm run dev
npm run build && npm start
npm run lint
npm run e2e           # Playwright
npm run e2e:ui        # Playwright UI
```

**Rules of the road:** no `any` (strict TS), no framework-specific branches in trading engine or UI, no external HTTP inside DB transactions, missing financial data = `null`, explanations generated backend-side, every PR updates the affected doc + tradeoff table.

---

## 15. Deployment

> Full guide: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

| Piece | Where | Config |
|---|---|---|
| Backend | **Render** Web Service, root `backend` | Build: `npm install && npx prisma generate` · Start: `npx prisma migrate deploy && node dist/main` · Env: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, optional FMP/Sentry/Resend |
| Database | Render Postgres | Append `?sslmode=require` |
| Cache | Render Redis | `REDIS_URL` |
| Frontend | **Vercel**, root `frontend` | Env: `NEXT_PUBLIC_API_URL=https://<render-url>/api/v1`, `NEXT_PUBLIC_SITE_URL`, optional Sentry DSN · Ensure backend `FRONTEND_URL` matches Vercel URL for CORS |

**Post-deploy checklist:** `GET /api/v1/health` → `GET /docs` → register/login → search → compliance evaluate → buy/sell → Sentry event arrives.

---

## 16. Product & business model

> Full spec: [`docs/21-monetization.md`](./docs/21-monetization.md)

**Freemium + B2B API.** Core compliance evaluation (the IP + the "aha!") is **free forever**. Revenue comes from workflow, not verdicts:

| Tier | Audience | Price (target) | What pays |
|---|---|---|---|
| **Free** | Everyone | $0 | Full evaluations + explanations, paper trading, watchlists — the growth engine |
| **Premium** | Power users | $9–15/mo | Purification calculator, custom thresholds, portfolio analytics, alerts, priority data |
| **B2B API** | Brokerages, fintechs, institutions | Usage-metered | Compliance-as-an-API, institutional frameworks, white-label education |
| **Marketplace** (later) | Community | Rev-share | Shared/custom frameworks |

**Unit economics:** ~$0.035/free-user/mo (cached delayed data + lazy evaluation saves >80% vs. nightly batch of 10k tickers). 10k free users ≈ $350/mo ≈ ~40 premium subs. **Trust Firewall:** no pay-to-play ratings, no data selling, no in-engine ads — monetization can never influence a verdict.

---

## 17. For recruiters

### Competency matrix

| Competency | Level | Proof |
|---|---|---|
| System design | Staff+ | Plugin Compliance Engine (§4), modular monolith (§7) |
| DDD | Senior+ | Bounded contexts, aggregates, value objects (`docs/09-domain-models.md`) |
| Database engineering | Senior+ | BIGINT cents, JSONB hybrid, pessimistic locking (§5, §9) |
| API design | Senior+ | REST contracts, error envelopes, throttling (§10, `docs/13-api-design.md`) |
| Frontend architecture | Senior+ | RSC leaves, Query/Zustand split, Suspense streaming (§11, `docs/12-frontend-architecture.md`) |
| Security | Senior | OWASP mitigations, ownership auth, revocation (§12, `docs/17-security.md`) |
| Observability / SRE | Senior | Tracing, Pino, Sentry, health probes (§12, `docs/18-observability.md`) |
| Product management | Senior+ | Personas, MVP scoping, PLG monetization (§16, `docs/03-user-personas.md`, `19`, `21`) |
| UX / design systems | Senior | Progressive disclosure, dark tokens, a11y (`docs/06-design-system.md`, `08`) |
| Fintech domain | Deep | AAOIFI math, purification, market-hours simulation (§4, §5) |

### Interview talking points

- **System design:** *"Same endpoint evaluates Islamic law, ESG, or custom rules with zero branching — plugin architecture + JSONB configs + standard output contract. New framework = data row + 3 classes."*
- **Backend:** *"Pessimistic `SELECT FOR UPDATE` for ledgers — a corrupted balance costs more than a lock wait. And I fetch market price before opening the transaction to never hold locks during network I/O."*
- **Frontend:** *"Asset page streams Chart + ComplianceCard via independent Suspense boundaries. Lightweight Charts lives in `React.memo` + `useRef` + `useEffect` with strict cleanup — no canvas leaks."*
- **Product:** *"Anti-personas (no day traders) justified 15-min delayed data over real-time licensing — thousands saved, target users unaffected."*
- **Trust:** *"Missing data → `null` → `INSUFFICIENT_DATA`, never a guessed pass. In ethics-fintech, reliability means protecting users from acting on bad data."*

### Where to look in a code review

1. `backend/src/modules/compliance/` — `IRuleEvaluator`, factory, explanation templates, null-handling tests.
2. `backend/src/modules/trading/` — transaction boundaries, `FOR UPDATE`, decimal math, market-hours queue.
3. `backend/src/modules/market-data/providers/` — Zod ACL, multi-provider fallback, Redis coalescing.
4. `prisma/schema.prisma` — BIGINT/DECIMAL discipline, JSONB configs, index strategy.
5. `frontend/src/app/asset/[ticker]/` + `components/compliance/` — dumb UI over smart contract, Suspense split.
6. `docs/` — 32 docs with explicit Tradeoffs/Risks in each; start at `22-recruiter-highlights.md`.

---

## 18. For founders

- **Moat:** explainable, auditable, user-tunable compliance engine with switching costs (your custom thresholds live here). Competitors sell data; NiyyaTrade sells reasoning.
- **Expansion paths:** ESG/Dividend/Value/Custom/Community/Institutional frameworks without re-architecture; Compliance-as-an-API; classroom white-label; purification + tax reporting; alerts; mobile.
- **Cost control:** lazy evaluation + Redis (not nightly batch), delayed data (not real-time licenses), monolith (not microservice ops), generous-but-cheap free tier funding itself via premium conversion.
- **Risk posture:** educational-use labeling (not financial advice), versioned rules, stale-cache + multi-provider resilience, secrets hygiene, health-gated deploys.

---

## 19. Documentation index

32 living docs in [`docs/`](./docs/) — the engineering record. Every doc carries Tradeoffs + Risks.

| # | Doc | Covers |
|---|---|---|
| 00 | Product Foundation | Vision, principles, non-goals, stack, success criteria |
| 01 | Market Opportunity | TAM/SAM/SOM, Islamic + ESG sizing |
| 02 | Competitive Analysis | Simulator landscape, differentiation |
| 03–05 | Personas, Journeys, IA | Users, flows, navigation |
| 06–08 | Design System, Pages, Components | Tokens, inventory, library |
| 09–10 | Domain Models, Database | DDD, schema, indexes |
| 11–13 | Backend, Frontend, API | Modules, RSC/Query, contracts |
| 14–16 | Compliance, Trading, Market Data | The three engines |
| 17–18 | Security, Observability | Threats, tracing, alerting |
| 19–21 | MVP, Roadmap, Monetization | Scope, phases, pricing |
| 22 | Recruiter Highlights | Competency map + talking points |
| 23–25 | Phases, Tasks, Naming, Checklist | Execution + launch gates |
| — | AI Instructions, Readiness Review, Audits | Agent rules, pre-impl review, audit log |

Plus [`DEPLOYMENT.md`](./DEPLOYMENT.md), [`AUDIT.md`](./AUDIT.md) (internal), `backend/README.md`, `frontend/README.md`.

---

## 20. Roadmap

**Shipped:** auth + JWT revocation + password reset, 3 frameworks with overrides, paper trading (market/limit, fractional, FX-safe), multi-provider market data, watchlists, dashboard, Cmd+K, Sentry + Pino + health checks, Render/Vercel deploys, SEO/OG.

**Next (from audit):** Google OAuth backend strategy, dividend/corporate-action cron (`DIVIDEND` txn type reserved), market-hours gating for pending limit fills + holiday calendar, schema cascade deletes, landing polish + functional alerts, watchlist polling + cache-key + `KEYS→SCAN` fixes, Swagger/`X-Request-ID`/env-validation hardening, OpenAPI codegen to kill FE type duplication.

**Later:** refresh/silent renewal polish, email verification, price alerts, volume series on charts, custom-framework builder, purification calculator, B2B API, mobile.

---

## 21. Contributing

Private project — not accepting external PRs at this time. For internal contributors: branch from `main`, keep modules within their bounded context, add Jest coverage for every evaluator path (pass/fail/edge/null), run lint + tests, and update the relevant `docs/` page including its Tradeoffs table.

---

## 22. Disclaimer & license

**Educational use only — not financial, investment, or religious advice.** Compliance evaluations are computed from third-party data that may be delayed, incomplete, or restated. Always verify with primary filings and consult a qualified advisor/scholar before making real investment decisions.

**License:** Private — All rights reserved.

---

*Built with intention. If you read this far — star the repo, open an issue, or walk the 10-minute test above. The engine remembers why.*
