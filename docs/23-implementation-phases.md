# 23 — Implementation Phases (Sprint Plan)

> **Document Status:** Living Document · v1.1
> **Last Updated:** 2026-07-03
> **Owner:** Engineering Manager / Tech Lead
> **Audience:** Engineering Team, Scrum Masters, Product Managers
> **Depends On:** `19-mvp-definition.md`, `11-backend-architecture.md`, `12-frontend-architecture.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Executive Summary](#2-executive-summary)
3. [Phase 1 (Sprint 1): Foundation & Scaffold](#3-phase-1-sprint-1-foundation--scaffold)
4. [Phase 2 (Sprint 2): Market Data & Auth](#4-phase-2-sprint-2-market-data--auth)
5. [Phase 3 (Sprint 3): The Compliance Engine](#5-phase-3-sprint-3-the-compliance-engine)
6. [Phase 4 (Sprint 4): The Paper Trading Engine](#6-phase-4-sprint-4-the-paper-trading-engine)
7. [Phase 5 (Sprint 5): Frontend Assembly](#7-phase-5-sprint-5-frontend-assembly)
8. [Phase 6 (Sprint 6): Polish, Test, & Launch](#8-phase-6-sprint-6-polish-test--launch)

---

## 1. Purpose

While `20-future-roadmap.md` defines the multi-year macro vision, this document defines the micro execution. It provides a tactical blueprint for engineering the Phase 1 MVP across 6 distinct phases (sprints). Each phase strictly outlines the objective, tasks across all layers, and acceptance criteria to ensure zero ambiguity during execution.

---

## 2. Executive Summary

The MVP will be delivered in **6 Two-Week Sprints** (12 weeks total). The execution strategy follows the "Walking Skeleton" pattern—building vertical slices from the database to the UI, frontloading the highest risk backend logic (Market Data, Compliance Math) early, and reserving the final sprints for UI polish and production hardening.

---

## 3. Phase 1 (Sprint 1): Foundation & Scaffold

### Objective
Establish the core engineering environment so that all developers can write code, run tests locally, and deploy seamlessly to a staging environment.

### Features
- Centralized monorepo/repositories initialized.
- UI Component Library baseline.
- Core Database Schema live in staging.

### Frontend Tasks
- [ ] Initialize Next.js App Router project with TypeScript and Tailwind CSS.
- [ ] Configure Shadcn UI component base (Buttons, Inputs, Modals).
- [ ] Setup TanStack Query v5 provider and global Axios instance.
- [ ] Implement the base Layout structure (Sidebar, Top Nav) with routing placeholders.

### Backend Tasks
- [ ] Initialize NestJS application structure.
- [ ] Configure `pino` logger for structured JSON logging.
- [ ] Establish standard API Error Envelopes (`{ data, error, meta }`).
- [ ] Implement global exception filters.

### Database Tasks
- [ ] Initialize Prisma ORM.
- [ ] Define the physical Postgres schema based on `10-database-design.md` (Users, Portfolios, Frameworks).
- [ ] Generate and run initial database migrations against local and staging databases.

### Infrastructure Tasks
- [ ] Setup Docker Compose for local Postgres and Redis instances.
- [ ] Setup GitHub Actions for CI (Linting, TypeScript Compilation, Prisma Generate).
- [ ] Configure Vercel (Frontend) and Render/AWS (Backend) deployment pipelines for staging.

### Acceptance Criteria
- [ ] All engineers can run `npm run dev` locally and have a functioning full-stack environment.
- [ ] Pushing to the `main` branch automatically deploys to the staging URLs.
- [ ] The Postgres database is accessible via Prisma Studio.

### Deliverables
- Live staging environments (Frontend and Backend APIs).
- Automated CI pipeline.
- Base Next.js and NestJS repositories.

### Dependencies
- Cloud provider accounts (AWS/Vercel) provisioned and access granted to DevSecOps.

---

## 4. Phase 2 (Sprint 2): Market Data & Auth

### Objective
Build the "Gates and Fuel" of the application: secure user authentication and the ability to safely ingest and sanitize third-party financial data.

### Features
- User Registration & Login via OAuth/Email.
- Real-time and historical stock price ingestion.
- Universal Command Palette for stock searching.

### Frontend Tasks
- [ ] Build the `/login` and `/register` UI screens.
- [ ] Implement the Universal Command Palette (`Cmd+K`) UI.
- [ ] Connect the Command Palette to the `/market-data/search` API endpoint.

### Backend Tasks
- [ ] Scaffold Auth.js/NextAuth or JWT authentication endpoints.
- [ ] Implement `MarketDataModule` connecting to Polygon.io/FMP.
- [ ] Build the Anti-Corruption Layer (Zod validation) to sanitize incoming financial data.

### Database Tasks
- [ ] Update schema to handle OAuth provider IDs.
- [ ] Create seed scripts for basic test users.

### Infrastructure Tasks
- [ ] Deploy and configure Redis cluster in staging.
- [ ] Setup Redis caching rules (1-min for quotes, 24h for fundamentals) in the backend logic.

### Acceptance Criteria
- [ ] A user can successfully register, login, and receive a JWT/Session cookie.
- [ ] Searching for "AAPL" in the frontend command palette returns sanitized results from the backend API, properly cached in Redis.

### Deliverables
- Working authentication flow.
- Internal Market Data API acting as a proxy for third-party providers.

### Dependencies
- Production/Sandbox API keys acquired from the chosen financial data vendor (Polygon.io/FMP).

---

## 5. Phase 3 (Sprint 3): The Compliance Engine

### Objective
Develop the core Intellectual Property (IP): the rules engine that evaluates financial fundamentals against Islamic Jurisprudence (AAOIFI) standards.

### Features
- Dynamic evaluation of stock compliance.
- Generation of human-readable compliance explanations.
- Initial UI rendering of compliance verdicts.

### Frontend Tasks
- [ ] Build the `ComplianceCard` and `RuleAccordion` UI components.
- [ ] Create the TanStack Query hook `useComplianceReport(ticker)`.
- [ ] Wire the UI to display the compliance verdict for a searched asset.

### Backend Tasks
- [ ] Build the `EngineCore` compiler pipeline.
- [ ] Implement the `IRuleEvaluator` interface.
- [ ] Write the 3 AAOIFI Rule plugins (Sector, Debt, Interest) with 100% test coverage.
- [ ] Implement the template engine to generate plain-English explanation strings.
- [ ] Expose `GET /compliance/evaluate`.

### Database Tasks
- [ ] Seed the database `frameworks` table with the default Halal AAOIFI JSONB ruleset.
- [ ] Setup `framework_overrides` schema for future user customizations.

### Infrastructure Tasks
- [ ] Configure heavy Redis caching for `EvaluationReport` outputs to prevent repetitive math computations.

### Acceptance Criteria
- [ ] Backend unit tests prove that companies with > 33% debt fail the rule and return a correct explanation string.
- [ ] The frontend Asset Detail page successfully displays the Halal/Not Halal status for AAPL based on real API data.

### Deliverables
- The isolated Compliance Framework Engine module.
- Working AAOIFI Ruleset.

### Dependencies
- Phase 2 Market Data API must be fully functional to feed data into the engine.

---

## 6. Phase 4 (Sprint 4): The Paper Trading Engine

### Objective
Create the immutable ledger system allowing users to buy and sell fractional shares without risking race conditions or corrupted balances.

### Features
- Virtual portfolio creation.
- Market order execution (Buy/Sell).
- Portfolio holding displays.

### Frontend Tasks
- [ ] Build the `OrderTicket` UI (Buy/Sell toggle, Quantity input, Estimated Cost).
- [ ] Build the `PortfolioTable` UI for the user dashboard.
- [ ] Implement cache invalidation so `usePortfolio` updates immediately after an order is placed.

### Backend Tasks
- [ ] Implement `TradingService.executeMarketOrder()`.
- [ ] Implement `decimal.js` math for precise fractional share calculations.
- [ ] Expose `POST /portfolio/orders` and `GET /portfolio`.

### Database Tasks
- [ ] Write the strict PostgreSQL `SELECT ... FOR UPDATE` transaction blocks for order execution to prevent double-spends.
- [ ] Ensure currency columns strictly enforce `BIGINT` (cents) and quantities enforce `DECIMAL(15,6)`.

### Infrastructure Tasks
- [ ] Implement BullMQ (Redis Queues) to handle market hours simulation (e.g., delaying night orders until 9:30 AM).

### Acceptance Criteria
- [ ] Users cannot buy shares if their `available_cash_cents` is lower than the order total.
- [ ] Simultaneous API requests to buy shares (race conditions) are safely blocked by database locks.

### Deliverables
- Working virtual brokerage ledger.
- Dashboard portfolio view.

### Dependencies
- Phase 1 Database setup and Phase 2 Auth must be rock solid to track user portfolios securely.

---

## 7. Phase 5 (Sprint 5): Frontend Assembly

### Objective
Connect all the isolated pieces into a cohesive, highly performant primary user journey, culminating in the "Aha!" moment where a user searches, evaluates, and buys a stock.

### Features
- The polished `/assets/[ticker]` page.
- Interactive financial charts.
- Guest-to-User Intercept flows.
- Custom Framework override settings.

### Frontend Tasks
- [ ] Assemble the final Asset page using Suspense Boundaries (fetching chart data and compliance data in parallel).
- [ ] Integrate TradingView Lightweight Charts, ensuring `useRef` cleanup to prevent memory leaks.
- [ ] Build the Settings UI allowing users to override the 33% debt threshold.
- [ ] Implement the Guest-to-User Intercepting Route (Clicking "Buy" while logged out opens the Login modal over the current context).

### Backend Tasks
- [ ] Optimize any slow API routes discovered during assembly.
- [ ] Finalize the `PUT /users/me/framework-prefs` API endpoint to accept JSONB overrides.

### Database Tasks
- [ ] Add composite indexes to `positions` and `orders` tables to optimize the heavy read paths on the dashboard.

### Infrastructure Tasks
- [ ] Implement Redis-backed API Rate Limiting to prevent scraping and API abuse.

### Acceptance Criteria
- [ ] The TradingView chart renders without flickering or crashing the browser after viewing 20 different assets.
- [ ] A user can change their personal debt threshold to 30%, and the UI immediately reflects the new compliance status via an optimistic update.

### Deliverables
- A functionally complete, End-to-End HalalTrade web application.

### Dependencies
- Final, pixel-perfect Figma designs must be handed off from the Design team for the Asset Page and Dashboard.

---

## 8. Phase 6 (Sprint 6): Polish, Test, & Launch

### Objective
Ensure the application is stable, secure, heavily tested, and ready to handle public traffic without crashing.

### Features
- Production-grade security.
- Comprehensive Test Coverage.
- Live Soft/Hard Launches.

### Frontend Tasks
- [ ] Audit accessibility (a11y) across all interactive components (keyboard navigation, ARIA labels).
- [ ] Fix any layout shifts (CLS) on the critical Asset page.

### Backend Tasks
- [ ] Conduct a security audit on all API endpoints ensuring users can only access their own `portfolio_id`.
- [ ] Review all P0 "Stop The Line" guidelines outlined in `implementation-audit.md`.

### Database Tasks
- [ ] Verify final production database connection pooling limits (PgBouncer/Prisma Accelerate) to handle traffic spikes.

### Infrastructure Tasks
- [ ] Rotate all development API keys and inject production keys via Vercel/AWS Secret Manager.
- [ ] Enable CORS restrictions to strictly allow requests only from the production frontend domain.
- [ ] Verify Sentry error tracking and PagerDuty routing are functional.
- [ ] Run load tests (K6) against the Market Data Redis cache.

### Acceptance Criteria
- [ ] E2E tests (Cypress/Playwright) successfully navigate the critical path (Login -> Search -> View Compliance -> Buy) without failure.
- [ ] Load tests prove the compliance engine can serve cached results for 1,000 concurrent users.

### Deliverables
- V 1.0 Production Release.

### Dependencies
- Beta testing group (50 users) secured for the internal Soft Launch before the public Hard Launch.

---

> **End of Document**
>
> Sprints are timeboxed. If a feature (e.g., Custom Framework Overrides) threatens to delay Phase 5, it must be feature-flagged off and moved to a post-launch sprint. The primary goal is delivering the core value (Compliance + Trading) on schedule.
