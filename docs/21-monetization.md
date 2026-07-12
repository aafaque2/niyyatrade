# 21 — Monetization

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-07-02
> **Owner:** Product & Business Strategy
> **Audience:** Product Managers, Engineering, Investors, Recruiters
> **Depends On:** `19-mvp-definition.md`, `20-future-roadmap.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Monetization Philosophy](#5-monetization-philosophy)
6. [Tier 1: Free Forever (The Growth Engine)](#6-tier-1-free-forever-the-growth-engine)
7. [Tier 2: Premium (The Power User)](#7-tier-2-premium-the-power-user)
8. [Tier 3: B2B API (The Platform Revenue)](#8-tier-3-b2b-api-the-platform-revenue)
9. [Revenue Stream 4: Marketplace Fees](#9-revenue-stream-4-marketplace-fees)
10. [Pricing Benchmarks & Competitive Positioning](#10-pricing-benchmarks--competitive-positioning)
11. [Unit Economics & Cost Structure](#11-unit-economics--cost-structure)
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

This document defines how HalalTrade (working name) generates revenue. A product without a monetization strategy is a hobby project. This document ensures that the free tier is generous enough to drive viral adoption while the premium tiers are compelling enough to generate sustainable revenue without compromising the platform's educational mission.

Critically, monetization must never undermine trust. If users suspect that a "Compliant" rating is influenced by a paid partnership with a listed company, the platform is dead. Revenue must come from user value, never from data manipulation.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| MN-1 | Define a freemium model | Free tier must be valuable enough to drive word-of-mouth growth in the target community. |
| MN-2 | Establish revenue streams aligned to phases | Each monetization tier maps cleanly to a roadmap phase (`20-future-roadmap.md`). |
| MN-3 | Protect editorial independence | Compliance evaluations must never be influenced by revenue relationships. |
| MN-4 | Model unit economics | Ensure that the cost to serve a free user is low enough to sustain a large free tier. |

---

## 3. Scope

### 3.1 In Scope
- Free, Premium, and B2B tier definitions.
- Feature gating strategy (what is free vs. paid).
- Competitive pricing analysis.
- Unit economics modeling.

### 3.2 Out of Scope
- Detailed Stripe integration specifications.
- Exact pricing (will be A/B tested at launch).
- Investor financial projections or fundraising models.

---

## 4. Executive Summary

HalalTrade uses a **Freemium + B2B API** monetization model structured in three tiers:

| Tier | Audience | Revenue Model | Phase |
|---|---|---|---|
| **Free** | Everyone | $0 — Growth engine | Phase 1 |
| **Premium** | Power Users (Fatima) | $9-15/month Subscription | Phase 2 |
| **B2B API** | Brokerages, Fintechs | Usage-based metered billing | Phase 5 |

The free tier is deliberately generous. The core Compliance Engine evaluation—including the full rule-by-rule explanations—is free for every asset, forever. This ensures the "Aha!" moment that drives user acquisition is never paywalled.

Premium revenue comes from *workflow tools* (Purification Calculator, Portfolio Analytics, Custom Frameworks), not from the core screening logic. This preserves trust while monetizing the power user segment.

---

## 5. Monetization Philosophy

### 5.1 The "Core is Free, Workflow is Paid" Principle
- **Free:** Checking if AAPL is Halal? Always free. Reading the explanation? Always free. Paper trading? Always free.
- **Paid:** Tracking how your 20-stock portfolio's compliance drifted over 6 months? Premium. Calculating the exact purification amount on your dividends? Premium.

This mirrors the playbooks of successful developer tools:
- GitHub: Code hosting is free. CI/CD and advanced project management are paid.
- Figma: Editing is free. Team libraries and branching are paid.

### 5.2 The Trust Firewall
Revenue must never come from:
- Promoting specific stocks as "Halal" in exchange for payment (Pay-to-Play).
- Selling user portfolio data to hedge funds or advertisers.
- Displaying ads within the Compliance Engine output (destroys credibility).

---

## 6. Tier 1: Free Forever (The Growth Engine)

**Target Persona:** Amir (The Cautious Beginner)
**Phase:** Available from Day 1 (Phase 1 MVP)

### 6.1 Included Features
| Feature | Limit |
|---|---|
| Asset Compliance Screening | Unlimited (All US Equities) |
| Rule-by-Rule Explanations | Full access |
| Paper Trading | 1 Virtual Portfolio, $100k balance |
| Market Data (15-min delayed) | Full access |
| Watchlist | Up to 10 assets |
| Active Framework | 1 (Default AAOIFI Halal) |

### 6.2 Why This Works
- The free tier demonstrates 100% of the core product's value. Users experience the full "Aha!" moment without paying.
- Limitation: The free user can only use the *default* Halal framework. They cannot customize thresholds or switch to ESG. This is the natural upsell trigger.

---

## 7. Tier 2: Premium (The Power User)

**Target Persona:** Fatima (The Analytical Investor)
**Phase:** Soft-launched in Phase 2, fully monetized by Phase 3
**Estimated Price:** $9-15 / month (or $79-119 / year)

### 7.1 Included Features (Everything in Free, plus)
| Feature | Detail |
|---|---|
| Custom Framework Thresholds | Adjust Debt/Interest limits to match any scholarly opinion |
| Multiple Active Frameworks | Switch between Halal, ESG (Phase 4+), and custom frameworks |
| Purification Calculator | Full dividend tracking and charity obligation ledger |
| Portfolio Compliance History | View how your portfolio's compliance drifted over time |
| Advanced Analytics | Sector allocation, diversification score, risk metrics |
| Watchlist | Unlimited assets |
| Multiple Virtual Portfolios | Up to 5 (e.g., "Conservative Halal", "Growth ESG") |
| Compliance Alerts | Email notifications when a holding's status changes |

### 7.2 The Upsell Trigger
The free user hits the paywall organically at the moment of highest intent:
1. Amir has been using the free tier for 2 weeks. He's comfortable.
2. He reads online that "some scholars say 30% debt is the limit, not 33%."
3. He goes to Settings and tries to change the threshold.
4. A tasteful, non-aggressive modal appears: *"Custom thresholds are a Premium feature. Tailor the engine to your specific scholarly beliefs for $9/month."*

This is a value-driven upsell, not an arbitrary paywall.

---

## 8. Tier 3: B2B API (The Platform Revenue)

**Target Audience:** Other Fintechs, Robo-Advisors, Islamic Banks
**Phase:** Phase 5
**Revenue Model:** Usage-based metered billing (via Stripe Metered Billing)

### 8.1 The Product
Expose the `GET /compliance/evaluate` endpoint as a public, documented, rate-limited API that third parties can call programmatically.

**Use Case:** A Halal Robo-Advisor (like Wahed Invest) needs to screen 500 stocks nightly. Instead of building their own engine, they pay HalalTrade $0.01 per evaluation.

### 8.2 Pricing Tiers

| Plan | Monthly Fee | Included Evaluations | Overage Rate |
|---|---|---|---|
| **Starter** | $49/mo | 5,000 | $0.02 / eval |
| **Growth** | $199/mo | 50,000 | $0.01 / eval |
| **Enterprise** | Custom | Unlimited | Custom SLA |

### 8.3 Why This is Defensible
Building a Compliance Engine from scratch (data vendor contracts, financial math, explainability layer, multi-framework architecture) costs 6-12 months of senior engineering time. HalalTrade offers it as a plug-and-play API, providing immense value to small and mid-size Fintechs.

---

## 9. Revenue Stream 4: Marketplace Fees

**Phase:** Phase 5
**Revenue Model:** Revenue share on premium community frameworks

### 9.1 The Model
In Phase 5, users can publish their custom compliance frameworks to the Community Marketplace. If a framework creator charges followers $2/month to subscribe to their framework (e.g., "Sheikh Zaid's Strict Halal Framework"), HalalTrade takes a 20-30% platform fee.

### 9.2 Why This Works
- Creates a **creator economy** within the platform.
- Generates recurring revenue with zero additional engineering effort per framework published.
- Drives network effects: More creators → More frameworks → More users → More creators.

---

## 10. Pricing Benchmarks & Competitive Positioning

| Competitor | Product | Price | HalalTrade Advantage |
|---|---|---|---|
| **Zoya** | Halal Stock Screener | $8.33/mo (Annual) | HalalTrade offers paper trading, custom thresholds, and explainability for a similar or lower price point. |
| **Islamicly** | Halal Screening + News | ~$10/mo | HalalTrade provides deeper rule-by-rule math, not just a badge. |
| **Morningstar Premium** | General Research | $34.95/mo | HalalTrade is 3x cheaper and vertically specialized, offering a more compelling value proposition for its niche. |
| **TradingView Pro** | Charting & Analysis | $14.95/mo | HalalTrade bundles charting with compliance evaluation, offering unique value for the target market. |

**Positioning:** HalalTrade is priced below general financial tools but at parity with niche Halal screeners, while offering significantly more functionality (Paper Trading + Explainability + Configurability).

---

## 11. Unit Economics & Cost Structure

### 11.1 Cost Per Free User (Monthly)
| Cost Driver | Estimated Monthly Cost | Notes |
|---|---|---|
| Market Data API | $0.02 | Aggressively cached via Redis. Most evaluations hit the 24-hour cache. |
| Compute (NestJS/Postgres) | $0.01 | Shared infrastructure. Marginal cost per user is negligible. |
| Hosting (Vercel/Next.js) | $0.005 | Static and ISR pages are cheap to serve. |
| **Total** | **~$0.035** | |

### 11.2 Why the Free Tier is Sustainable
At $0.035/user/month, supporting 10,000 free users costs ~$350/month. This is trivially covered by even 50 Premium subscribers at $9/month ($450/month). The free tier is a growth investment, not a cost center.

### 11.3 Premium Tier Margins
| Revenue (Per Premium User) | $9.00/mo |
|---|---|
| Infrastructure Cost | ~$0.10/mo (Higher due to alerts, analytics) |
| Payment Processing (Stripe 2.9%) | ~$0.26/mo |
| **Gross Margin** | **~96%** |

Software subscriptions with heavy caching produce exceptionally high margins.

---

## 12. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Core Screening: Free vs. Paid** | Free | Paywall after 5 lookups/day | Paywalling the core evaluation cripples the viral loop. If Amir can't share a compliance link with his friends without them hitting a paywall, word-of-mouth dies. |
| **Monetization Timing** | Phase 2 (Month 3+) | Phase 1 (Day 1) | Charging from Day 1 creates friction during the critical adoption phase. The first 3 months should focus exclusively on validating the product, not extracting revenue from a tiny user base. |
| **B2B Model** | Usage-Based (Metered) | Flat Monthly SaaS | Usage-based pricing scales with the customer's success. A small Fintech starting with 100 evaluations/month pays almost nothing. As they grow to 100,000/month, our revenue grows proportionally. |

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Low Conversion to Premium** | High | If < 3% of free users convert, the premium tier cannot sustain the free tier. **Mitigation:** The upsell trigger (Custom Thresholds) targets a genuine, validated pain point (scholarly differences). If conversion is still low, A/B test alternative Premium features as the gate. |
| **B2B Sales Cycle** | Medium | Enterprise Fintechs take 3-6 months to evaluate and procure a new API vendor. **Mitigation:** Begin sales conversations during Phase 3-4, so contracts are signed by Phase 5 launch. |
| **Price Sensitivity in Target Market** | Medium | Young Muslim professionals in the target demographic may be price-sensitive. **Mitigation:** Offer annual billing at a significant discount (~30%) and consider regional pricing for markets like Southeast Asia. |

---

## 14. Future Expansion

| Revenue Idea | Phase | Description |
|---|---|---|
| **White-Label Compliance Engine** | Phase 5+ | License the entire Compliance UI (Frontend + Backend) to Islamic Banks who want to embed screening into their own mobile apps under their own branding. |
| **Certified Halal Fund Ratings** | Phase 5+ | Evaluate and publicly rate entire ETFs/Mutual Funds for Halal compliance, similar to how Morningstar rates funds. Charge fund managers for a "HalalTrade Certified" badge. |

---

## 15. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Stripe** | Payment Infra | Required for Premium subscription management (recurring billing) and B2B metered billing. |
| **User Adoption (Phase 1)** | Business | Monetization only works if the free tier successfully drives adoption. If 0 users sign up, there is nobody to convert. |

---

## 16. Engineering Notes

- **Feature Flags for Gating:** Premium features must be gated via a feature flag system (e.g., LaunchDarkly or a simple DB `user.tier` check), not via separate code paths. The `FrameworkConfigurator` component should render the sliders regardless of tier, but disable interaction and show an upgrade prompt for free users. This prevents maintaining two separate codebases.
- **Stripe Webhook Handling:** When a user subscribes or cancels, Stripe sends a webhook event. The backend must idempotently process these events and update the `user.tier` in the database. Implement a `processed_event_ids` table to prevent double-processing.

---

## 17. Recruiter Impact Notes

### 17.1 What This Document Demonstrates
- **Business Acumen:** Demonstrates the ability to think beyond code and understand unit economics, gross margins, and competitive pricing strategy.
- **Product-Led Growth (PLG):** The "Core is Free, Workflow is Paid" philosophy mirrors the strategies of best-in-class PLG companies (Figma, Slack, Notion), proving familiarity with modern SaaS monetization patterns.
- **Revenue Diversification:** Planning three independent revenue streams (Consumer SaaS, B2B API, Marketplace Fees) demonstrates mature business architecture, not just technical architecture.

### 17.2 Talking Points
- "I designed the monetization to align with user trust. The compliance evaluation—the thing users rely on for their faith—is free forever. We monetize the *workflow tools* built around it, not the core ethical output."
- "At $0.035/user/month in infrastructure cost, we can sustain 100,000 free users for $3,500/month—easily covered by a few hundred premium subscribers. That's the power of aggressive Redis caching."

---

## 18. Business Impact Notes

- **Viral Growth Loop:** By keeping the core screening free and shareable (e.g., a user can share a link to `/assets/AAPL` that renders the full compliance card for unauthenticated visitors), every free user becomes a potential acquisition channel.
- **Defensible Revenue:** The B2B API creates revenue that is extremely sticky. Once an Islamic bank integrates the HalalTrade API into their portfolio management system, switching costs are astronomical (re-integration, re-validation, re-compliance review).
- **Platform Flywheel:** The Community Marketplace (Phase 5) creates a flywheel: more frameworks attract more users, more users attract more framework creators, more creators attract more users. Revenue from marketplace fees grows without proportional engineering investment.

---

## 19. Document Cross-References

| Document | Relationship |
|---|---|
| `20-future-roadmap.md` | Each monetization tier maps directly to a roadmap phase. |
| `14-compliance-engine.md` | The engine's output is the core product that the Free tier gives away and the B2B API sells. |
| `03-user-personas.md` | Premium features are designed specifically for Fatima's pain points (Custom Thresholds, Purification). |

---

> **End of Document**
>
> Monetization decisions must be reviewed against the Trust Firewall (Section 5.2) before implementation. Any revenue model that could be perceived as influencing compliance outcomes is immediately rejected.
