# 19 — MVP Definition (Phase 1)

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Principal Product Manager
> **Audience:** Engineering, Design, Marketing, Stakeholders
> **Depends On:** `04-user-journeys.md`, `07-page-inventory.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [The Core Problem & Value Proposition](#5-the-core-problem--value-proposition)
6. [In Scope (The Must-Haves)](#6-in-scope-the-must-haves)
7. [Out of Scope (The Will-Not-Haves)](#7-out-of-scope-the-will-not-haves)
8. [Success Metrics (KPIs)](#8-success-metrics-kpis)
9. [The "Aha!" Moment Validation](#9-the-aha-moment-validation)
10. [Tradeoffs](#10-tradeoffs)
11. [Risks](#11-risks)
12. [Future Expansion](#12-future-expansion)
13. [Dependencies](#13-dependencies)
14. [Engineering Notes](#14-engineering-notes)
15. [Recruiter Impact Notes](#15-recruiter-impact-notes)
16. [Business Impact Notes](#16-business-impact-notes)
17. [Document Cross-References](#17-document-cross-references)

---

## 1. Purpose

This document brutally defines the boundary of the Minimum Viable Product (MVP). In Fintech, scope creep is lethal. Developers want to add options trading, designers want to add social feeds, and users ask for crypto. 

This document acts as the definitive shield for the engineering team. If a feature is not listed in the "In Scope" section of this document, it will not be built before the initial public launch.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| MVP-1 | Restrict Scope | Deliver a functional, compliance-aware paper trading platform with exactly one framework (Halal). |
| MVP-2 | Validate Core Hypothesis | Prove that users value "Rule-by-Rule Explainability" enough to register an account. |
| MVP-3 | Cap MVP Costs | Launch without incurring expensive real-time data fees or complex brokerage API licensing. |
| MVP-4 | Ship Fast | Provide the smallest surface area necessary to gather real user feedback within a single development cycle. |

---

## 3. Scope

### 3.1 In Scope
- Definition of the MVP feature set across Auth, Trading, and Compliance.
- Definition of explicitly excluded features.
- Success metrics for the initial launch phase.

### 3.2 Out of Scope
- Marketing launch strategies and ad spend budgets.
- Detailed technical specs for the included features (Handled by the architecture docs).

---

## 4. Executive Summary

The HalalTrade MVP is designed to solve one specific problem for one specific user: **It allows the Halal-conscious beginner (Persona: Amir) to practice trading in a risk-free environment where every single stock is explicitly explained through the lens of Islamic Finance.**

To achieve this rapidly, the MVP sacrifices breadth for depth. It supports only US Equities (no crypto, no options). It utilizes 15-minute delayed data (to save costs). It supports only one compliance framework natively (AAOIFI Standard). It does not connect to real bank accounts. 

By aggressively cutting features, the team can focus 100% of its engineering effort on the quality, UX, and accuracy of the **Compliance Framework Engine**.

---

## 5. The Core Problem & Value Proposition

- **The Problem:** Current Halal screeners (like Zoya) tell you *what* is Halal but don't teach you *how* to trade it. Traditional brokers (like Robinhood) teach you how to trade but ignore your compliance needs, causing anxiety.
- **The Value Prop:** "A risk-free simulator that explains exactly why a stock is Halal, teaching you both finance and faith simultaneously."

---

## 6. In Scope (The Must-Haves)

If any of these features are broken, the MVP cannot launch.

### 6.1 Authentication & User Management
- Google OAuth (Single Sign-On).
- Email/Password fallback.
- Auto-provisioning of a $100,000 virtual portfolio upon signup.

### 6.2 The Compliance Engine (The Moat)
- Implementation of the AAOIFI Halal standard (Sectors, Debt-to-Equity, Interest Income).
- **Rule-by-Rule Explainability:** The UI must display the exact math (e.g., "31% < 33%") rather than just a pass/fail badge.
- **Custom Thresholds:** Users must be able to override the default 33% debt rule via the Settings UI, and the engine must respect it.

### 6.3 The Paper Trading Engine
- Ability to execute `MARKET` Buy/Sell orders using virtual cash.
- **Fractional Shares:** Support buying $10 of AAPL.
- **Market Hours Simulation:** Reject or queue orders placed outside 9:30 AM - 4:00 PM EST.
- Basic Portfolio Dashboard showing holdings, average cost, and Unrealized PnL.

### 6.4 Market Data & Discovery
- Universal Command Palette (`Cmd+K`) for searching US Equities (NYSE/NASDAQ).
- TradingView Lightweight Chart (1D, 1W, 1M, 1Y views).
- Ingestion of 15-minute delayed pricing and quarterly fundamentals via a vendor like Polygon.io.

---

## 7. Out of Scope (The Will-Not-Haves)

If someone proposes adding these before launch, the answer is an immediate **"No."**

### 7.1 Financial Instruments
- **Options & Futures:** Too mathematically complex for the MVP.
- **Crypto:** Highly speculative and introduces complex Shariah debate.
- **International Markets:** Stick to US Equities to minimize currency conversion and timezone logic.

### 7.2 Brokerage Features
- **Real Money Execution (Plaid/Alpaca):** Requires massive legal compliance (KYC/AML) and security overhead. The MVP is strictly "Paper."
- **Limit/Stop Orders:** Only Market orders are supported for V1 to simplify the execution queue.
- **Short Selling / Margin:** Explicitly banned in standard Islamic finance anyway.

### 7.3 Compliance Features
- **ESG Frameworks:** The engine architecture supports it, but the MVP UI and Marketing will focus 100% on the Halal use case to ensure tight product-market fit.
- **The Purification Calculator:** Calculating exact dividend charity payouts is complex. Moved to Phase 2.

### 7.4 Social & Community
- **Leaderboards / Social Feeds:** Distracts from the core educational value proposition.

---

## 8. Success Metrics (KPIs)

How we know if the MVP worked 30 days post-launch:

| Metric | Target | Rationale |
|---|---|---|
| **Guest-to-User Conversion Rate** | > 15% | Validates that showing the Compliance Explanation on the public Asset Page successfully drives users to create an account to paper trade. |
| **Week 1 Retention (W1)** | > 20% | Validates that the paper trading loop is sticky enough to bring users back. |
| **Custom Framework Usage** | > 10% of users | Validates that the "Analytical" persona (Fatima) actually values the ability to tweak rule thresholds. If 0% use it, we over-engineered the engine. |
| **API Cost Per MAU** | < $0.10 | Validates that our Redis caching strategy and Anti-Corruption Layer successfully shielded our vendor bills from spiking. |

---

## 9. The "Aha!" Moment Validation

The MVP is designed entirely around delivering one specific moment:
1. User searches a company they like (e.g., Apple).
2. User sees it is compliant.
3. User opens the accordion and reads *exactly why* it is compliant, learning a financial term (Debt-to-Equity) in the process.
4. User confidently buys $1,000 of it with virtual cash.

If the UX fails to deliver this sequence intuitively, the MVP fails, regardless of how clean the backend code is.

---

## 10. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Data Latency** | 15-Minute Delayed | Real-Time | Real-time data requires paying exchange fees (often >$10k/mo) and managing WebSockets. Delayed data via REST APIs is cheap, reliable, and perfectly acceptable for a compliance simulator. |
| **Asset Universe** | Top 3000 US Equities | Global Equities (80k+) | Searching and caching 80,000 assets slows down the MVP. Restricting the universe to major US stocks ensures high data quality and fast search. |
| **Order Types** | Market Orders Only | Limit / Stop Orders | Building an internal matching engine to simulate Limit orders filling at specific price ticks requires massive engineering effort. Market orders provide instant gratification for the beginner persona. |

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Lack of Urgency** | High | Because there is no real money on the line, users may sign up, do one trade, and never return. **Mitigation:** Rely on the educational content (Compliance Explanations) to drive retention, making the platform a "research tool" even if they don't actively paper trade daily. |
| **Data Provider Errors** | High | If our data vendor returns inaccurate fundamental data, users will accuse our Compliance Engine of being "Haram" (impermissible). **Mitigation:** The Anti-Corruption Layer (ACL) must aggressively flag missing data as `INSUFFICIENT_DATA` rather than guessing. |

---

## 12. Future Expansion

| Feature | Description | Target Phase |
|---|---|---|
| **Phase 2: The Auditor** | Purification calculators, Dividend tracking, Advanced portfolio analytics. | Month 3 |
| **Phase 3: Real Money** | Alpaca Brokerage API integration, Plaid bank linking, KYC onboarding. | Month 6 |
| **Phase 4: Multi-Framework** | Launching the ESG frameworks, Custom Community Framework publishing. | Month 9 |

---

## 13. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Product Design (Figma)** | Design | Engineering cannot begin on the core Asset Detail page until the exact layout of the Compliance Card is finalized. |
| **Financial API Vendor Contract** | Legal/Biz | Must secure a vendor (like Polygon) that permits the display of derived fundamental data on a public-facing website. |

---

## 14. Engineering Notes

- **Hardcoding is Okay (Sometimes):** For the MVP, it is acceptable to hardcode the list of "Haram Sectors" in the database initialization script rather than building a complex Admin UI to manage them. Focus engineering on the user-facing output.
- **Feature Flags:** Wrap major components (like the Framework Configurator) in LaunchDarkly (or custom) feature flags. If the configurator is buggy on launch day, we can disable it and fall back to the default Halal framework without delaying the launch.

---

## 15. Recruiter Impact Notes

### 15.1 What This Document Demonstrates
- **Ruthless Prioritization:** The ability to explicitly cut features (No Limit Orders, No Crypto, No Real Money) demonstrates mature Product Management skills. Junior engineers build everything; senior engineers build only what is necessary to validate the hypothesis.
- **Metric-Driven Engineering:** Tying engineering choices (Redis caching) directly to a business KPI (API Cost Per MAU < $0.10) shows an understanding of unit economics and cloud architecture.
- **User-Centric Delivery:** The entire MVP is scoped around validating the "Aha!" moment for a specific persona, proving alignment between code and customer value.

---

## 16. Business Impact Notes

- **Speed to Market:** By cutting real-brokerage integration, the company avoids months of legal reviews, compliance audits, and security certifications, allowing the product to reach users and generate feedback immediately.
- **The "Trojan Horse" Strategy:** The MVP functions as a high-value lead generation tool. By offering world-class compliance explanations for free (or via a simple signup), we capture the emails of high-intent Halal investors, building an audience we can monetize in Phase 3 when real trading launches.

---

## 17. Document Cross-References

| Document | Relationship |
|---|---|
| `00-product-foundation.md` | The principles established here (Explain Everything) dictate what MUST be in the MVP. |
| `03-user-personas.md` | The MVP is built exclusively for Amir (Beginner) and Fatima (Analytical). |
| `07-page-inventory.md` | Provides the exact list of P0 pages that must be built to satisfy this MVP definition. |

---

> **End of Document**
>
> If a developer begins work on a feature not explicitly listed in Section 6, the PR must be closed and redirected to the backlog. Scope creep is the enemy of the MVP.
