# 24 — Phase 7 Leftover Tasks

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-07-13

This document catalogs the remaining lower-priority gaps from the Phase 7 production UI overhaul that were deferred to preserve momentum. These can be picked up during future sprints or as maintenance backlog.

---

## 7.1 — Foundational UI (3 items)

- [ ] **Skeleton variants**: `PageSkeleton`, `DataCardSkeleton`, `TableSkeleton`, `ChartSkeleton` components (plan specified loading states for every region)
- [ ] **Breadcrumb component** for deep pages (e.g., `Portfolio > AAPL`)
- [ ] **User menu** in top nav (avatar/dropdown for logout)

## 7.2 — Landing Page (1 item)

- [ ] **Stats bar**: "X Frameworks · Y Assets Tracked · Z Paper Traders" with animated counters

## 7.3 — Auth Pages (2 items)

- [ ] **Confirm Password** field on register page
- [ ] **Social proof text** "Join X,XXX compliance-conscious investors" on auth forms

## 7.4 — Asset Detail Page (4 items)

- [ ] **"Compare Frameworks" button** in asset header
- [ ] **Bottom Action Bar**: Compare Frameworks · Add to Watchlist · View Full Report
- [ ] **"Insufficient Data" state** in compliance card (gray slate message for assets with null fundamentals)
- [ ] **Bottom sheet for order ticket** on mobile (Robinhood-style sticky bottom drawer)

## 7.6 — Frameworks (1 item)

- [ ] **"Custom Halal" third card** (coming soon) — plan specified 3 cards: AAOIFI, ESG, Custom

## 7.7 — Watchlist (2 items)

- [ ] **Volume column** in watchlist table
- [ ] **Compliance badge column** in watchlist table (requires batch compliance endpoint)

## 7.9 — Settings (2 items)

- [ ] **Framework overrides section** relocated from original settings to the new Settings page (currently only on /frameworks)
- [ ] **Notifications section** (preference toggles for email/push)

## 7.10 — Global UI (3 items)

- [ ] **Framework comparison modal** (side-by-side AAOIFI vs ESG evaluation)
- [ ] **Error boundaries wired** into page sections (component exists but unused)
- [ ] **Error boundary wiring** in individual section components

## 7.11 — Backend (1 item)

- [ ] **Watchlist endpoint enrichment** to return current prices + compliance status (currently client-side N+1)
