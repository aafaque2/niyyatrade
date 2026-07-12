# 00 — Product Foundation

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Product & Engineering Leadership
> **Audience:** Engineering, Product, Design, Investors, Recruiters

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Product Identity](#4-product-identity)
5. [Vision](#5-vision)
6. [Mission](#6-mission)
7. [Product Positioning](#7-product-positioning)
8. [Core Differentiator — The Compliance Framework Engine](#8-core-differentiator--the-compliance-framework-engine)
9. [Product Principles](#9-product-principles)
10. [Compliance Framework Architecture Philosophy](#10-compliance-framework-architecture-philosophy)
11. [Initial Frameworks](#11-initial-frameworks)
12. [Future Frameworks](#12-future-frameworks)
13. [Halal Investing Framework — Flagship Deep Dive](#13-halal-investing-framework--flagship-deep-dive)
14. [Target Users](#14-target-users)
15. [User Types & Access Model](#15-user-types--access-model)
16. [UX Philosophy](#16-ux-philosophy)
17. [Design References & Influences](#17-design-references--influences)
18. [Technical Stack Overview](#18-technical-stack-overview)
19. [Architecture Principles](#19-architecture-principles)
20. [Performance Principles](#20-performance-principles)
21. [Non-Goals & Explicit Exclusions](#21-non-goals--explicit-exclusions)
22. [Long-Term Product Vision](#22-long-term-product-vision)
23. [Success Criteria](#23-success-criteria)
24. [Recruiter Goals](#24-recruiter-goals)
25. [Tradeoffs](#25-tradeoffs)
26. [Risks](#26-risks)
27. [Future Expansion](#27-future-expansion)
28. [Dependencies](#28-dependencies)
29. [Engineering Notes](#29-engineering-notes)
30. [Business Impact Notes](#30-business-impact-notes)
31. [Recruiter Impact Notes](#31-recruiter-impact-notes)
32. [Document Cross-References](#32-document-cross-references)

---

## 1. Purpose

This document establishes the foundational product definition for **HalalTrade** (working name). It serves as the single authoritative reference for every decision made across product, design, engineering, and business strategy.

Every subsequent document in this documentation suite — from market analysis to database schemas, from API contracts to implementation phases — derives its constraints, goals, and principles from this foundation. If a downstream decision contradicts this document, this document takes precedence.

This is not a pitch deck. It is not a feature list. It is the operational constitution of the product.

### 1.1 Who Should Read This

| Audience | What They Gain |
|---|---|
| **Engineers** | Clarity on _why_ the system exists, the constraints it operates within, and the principles that should guide every technical decision |
| **Designers** | Understanding of the product identity, UX philosophy, and the emotional qualities the interface must convey |
| **Product Managers** | The decision framework for prioritization, scope, and feature evaluation |
| **Recruiters / Evaluators** | A concise but deep view of the product thinking, system design acumen, and domain expertise behind the project |
| **Investors (Future)** | Evidence that the product is built on defensible differentiation, not feature parity |

### 1.2 How This Document Should Be Used

- **Before writing code**, read this document to understand the system you are building.
- **Before designing a feature**, verify that it aligns with the Product Principles (§9).
- **Before proposing architecture**, ensure it respects the Architecture Principles (§19).
- **During code review**, use this document to evaluate whether a change serves the product or merely adds complexity.
- **During product debates**, use the Non-Goals (§21) to kill scope creep early.

---

## 2. Goals

### 2.1 Product Goals

| # | Goal | Measure of Success |
|---|---|---|
| G-1 | Build the most transparent virtual investing platform available | Every compliance decision surfaces a human-readable explanation with full auditability |
| G-2 | Make investing education an ambient, unavoidable part of the experience | Users cannot place a trade without encountering at least one educational touchpoint |
| G-3 | Demonstrate that investing frameworks can be abstracted, pluggable, and evaluated side-by-side | The Compliance Framework Engine evaluates trades against any registered framework without code changes |
| G-4 | Create a product that feels like a professional investing tool, not a learning toy | UI quality, information density, and interaction design match or exceed commercial fintech products |
| G-5 | Serve as a portfolio-grade demonstration of full-stack engineering excellence | Architecture, code quality, and documentation are recruiter-ready at every layer |

### 2.2 Business Goals

| # | Goal | Rationale |
|---|---|---|
| B-1 | Validate product-market fit with the Halal investing community first | Large underserved market (~$4.5T in Islamic finance assets globally); strong word-of-mouth potential |
| B-2 | Build a platform architecture that supports future monetization without re-architecture | SaaS-ready compliance APIs, premium framework tiers, and institutional licensing pathways |
| B-3 | Achieve sufficient product quality to attract early users organically | Reduces dependency on paid acquisition; builds trust through transparency |
| B-4 | Establish the Compliance Framework Engine as a defensible competitive moat | No existing simulator offers pluggable, explainable compliance frameworks |

### 2.3 Engineering Goals

| # | Goal | Detail |
|---|---|---|
| E-1 | Modular monolith with clear domain boundaries | Enables future service extraction without upfront microservice overhead |
| E-2 | Type-safe contracts from database to UI | TypeScript end-to-end, Prisma-generated types, validated API contracts |
| E-3 | Sub-200ms perceived latency for all core interactions | Route prefetching, optimistic updates, aggressive caching |
| E-4 | Observable system from day one | Structured logging, distributed tracing, health checks, error budgets |
| E-5 | Documentation as a first-class deliverable | Every major system has a corresponding design document; documentation ships with code |

---

## 3. Scope

### 3.1 In Scope (MVP)

- User authentication (Google OAuth, email/password via Auth.js)
- Stock search with autocomplete and market data display
- Compliance Framework Engine with two frameworks: Standard and Halal
- Paper trading engine (market orders, limit orders, portfolio tracking)
- Per-trade compliance evaluation with full explainability
- Portfolio dashboard with positions, P&L, and compliance status
- User settings (framework selection, profile management)
- Admin panel (basic user management, system health)
- Responsive web application (desktop-first, mobile-functional)

### 3.2 Out of Scope (MVP)

- Real money trading or brokerage integration
- Cryptocurrency support
- Mobile native applications (iOS/Android)
- Social features (following, leaderboards, community)
- AI-powered recommendations or robo-advisory
- Advanced order types (stop-loss, trailing stop, options, futures)
- Multi-currency support beyond USD
- Real-time streaming market data (polling with intelligent refresh is sufficient for MVP)

### 3.3 Scope Governance

Scope changes to this document require review and sign-off from both Product and Engineering leadership. Feature requests that contradict the Non-Goals (§21) are automatically rejected. Features that do not strengthen the Compliance Framework Engine or the educational mission should be deferred to post-MVP phases unless they are critical for basic usability.

---

## 4. Product Identity

### 4.1 Working Name

**HalalTrade**

The final product name will be decided after brand exploration (see `24-project-naming.md`). The working name reflects the flagship framework but does not represent the product's full identity.

### 4.2 Product Type Classifications

The platform occupies a unique intersection of several categories:

| Classification | Description |
|---|---|
| **Virtual Investing Platform** | Users simulate trades with virtual capital against real market data |
| **Investment Learning Platform** | Education is embedded in every interaction, not siloed into a "learn" section |
| **Portfolio Simulation Platform** | Users build, manage, and analyze virtual portfolios with professional-grade tools |
| **Compliance-Aware Investing Platform** | Every trade is evaluated against configurable compliance frameworks with full explainability |
| **Future Fintech SaaS** | Architecture supports eventual monetization via APIs, premium tiers, and institutional licensing |

### 4.3 One-Line Description

> A compliance-aware investing operating system that lets users learn, simulate, and evaluate investing decisions through pluggable, explainable frameworks.

### 4.4 Elevator Pitch (30 seconds)

Most investing simulators let you place fake trades and watch fake portfolios. They teach you mechanics, not thinking. HalalTrade is different. Every trade you place passes through a Compliance Framework Engine — a pluggable system that evaluates your decisions against real investment frameworks like Halal investing, ESG, value investing, or your own custom rules. It doesn't just tell you what happened. It tells you _why_ a decision was allowed, why it was blocked, and what the framework considers important. It's an investing operating system that teaches you how to think about investing, not just how to click buttons.

---

## 5. Vision

**Build the most transparent and educational virtual investing platform.**

This vision statement is deliberately narrow in scope and ambitious in quality. It does not aspire to be the biggest, the fastest, or the most feature-rich. It aspires to be the most _transparent_ — meaning every decision the system makes is visible, explainable, and auditable — and the most _educational_ — meaning users leave every session understanding something they didn't before.

### 5.1 Vision Decomposition

The platform should help users:

| Capability | What It Means |
|---|---|
| **Learn investing** | Understand fundamental concepts through usage, not lectures |
| **Simulate investing** | Execute trades with virtual capital against real market conditions |
| **Understand investing decisions** | See the reasoning behind every compliance evaluation, not just the outcome |
| **Build portfolios** | Construct and manage diversified virtual portfolios with professional tools |
| **Evaluate investment frameworks** | Compare how different frameworks (Halal, ESG, Value, etc.) affect the same portfolio |
| **Improve investing knowledge** | Track personal growth through decision history, compliance scores, and learning milestones |

### 5.2 Vision Anti-Patterns

The platform should **not** simply allow users to place virtual trades. Placing a virtual trade with no context, no evaluation, and no explanation is a solved problem. Every existing paper trading platform does this. If HalalTrade only does this, it has failed.

The platform should help users understand **why** decisions are made. The "why" is the product.

---

## 6. Mission

**Help people become better investors** by combining:

| Pillar | Role in the Platform |
|---|---|
| **Portfolio Simulation** | The action layer — users execute trades, manage positions, and track performance |
| **Financial Analysis** | The data layer — users see fundamental data, compliance metrics, and portfolio analytics |
| **Educational Guidance** | The learning layer — contextual tooltips, compliance explanations, and decision breakdowns |
| **Investment Frameworks** | The evaluation layer — pluggable rule engines that score and filter investment decisions |
| **Transparent Decision Making** | The trust layer — every system decision is explainable, auditable, and visible to the user |

These five pillars are not features. They are architectural commitments. Every feature must serve at least one pillar. Features that serve zero pillars do not belong in the product.

---

## 7. Product Positioning

### 7.1 What the Platform Is NOT

| Misconception | Why It's Wrong |
|---|---|
| **A broker** | No real money changes hands. No brokerage license. No order routing to exchanges. |
| **A trading terminal** | The product is not a Bloomberg Terminal clone. Information density is important, but the primary goal is education and framework evaluation, not professional trade execution. |
| **A stock screener** | Screening is a utility feature, not the core product. The core product is the Compliance Framework Engine. |
| **A religious platform** | The Halal framework is one supported compliance framework. The platform itself is secular. It supports any framework that can be expressed as configurable rules. |
| **A clone of existing investing products** | The Compliance Framework Engine has no equivalent in existing simulators. The product occupies a genuinely new category. |

### 7.2 What the Platform IS

**A modern investing operating system** that allows users to experiment with different investing frameworks while learning how investing decisions are made.

The term "operating system" is deliberate. An OS provides:

- **Abstractions** — The Compliance Framework Engine abstracts investment rules into pluggable, composable modules
- **Services** — The paper trading engine, market data system, and portfolio tracker provide core services that frameworks consume
- **Extensibility** — New frameworks can be added without modifying existing code
- **Visibility** — Every system decision is observable and explainable

### 7.3 Positioning Matrix

| Dimension | Typical Simulators | HalalTrade |
|---|---|---|
| **Trade Execution** | Place order → See result | Place order → Evaluate against framework → Explain decision → Execute or block → Show reasoning |
| **Education** | Separate "Learn" section with articles | Embedded in every interaction; contextual and decision-specific |
| **Compliance** | None or binary (allowed/blocked) | Multi-framework, configurable, explainable, auditable |
| **Frameworks** | None | Pluggable engine supporting unlimited frameworks |
| **Transparency** | "Trade rejected" | "Trade rejected because the company's debt-to-equity ratio (0.67) exceeds the Halal framework threshold (0.33). Here's what that means..." |

---

## 8. Core Differentiator — The Compliance Framework Engine

### 8.1 Why This Matters

Most investing simulators focus on:

- Virtual orders
- Charts
- Portfolio tracking

These are commodity features. Every simulator has them. They are table stakes, not differentiators.

HalalTrade focuses on:

- **Why decisions are allowed** — Surfacing the specific rules and data that make a trade compliant
- **Why decisions are blocked** — Explaining the exact threshold violation, the relevant financial data, and what the user could do differently
- **How frameworks affect investing behavior** — Showing users that the same portfolio looks radically different under Halal rules vs. ESG rules vs. Value investing rules

### 8.2 Engine Position in the Architecture

The Compliance Framework Engine is **not** a feature. It is the heart of the product.

```
┌──────────────────────────────────────────────────────────┐
│                      User Action                         │
│              (Search, Trade, Analyze)                     │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│              Compliance Framework Engine                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  Standard   │  │   Halal    │  │  Future Frameworks │  │
│  │  Framework  │  │  Framework │  │   (ESG, Value...)  │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
│                                                          │
│  Input:  Trade request + Market data + Company data      │
│  Output: Decision + Explanation + Audit trail            │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│              Paper Trading Engine                         │
│         (Execute, Track, Report)                          │
└──────────────────────────────────────────────────────────┘
```

Every investing action passes through framework evaluation. This is non-negotiable. There is no code path that bypasses the engine.

### 8.3 Engine Design Principles

| Principle | Description |
|---|---|
| **Pluggable** | New frameworks are registered as modules. Adding a framework requires no changes to the trading engine, the UI, or the API layer. |
| **Extensible** | Frameworks can define custom rules, custom thresholds, custom explanations, and custom UI hints. |
| **Explainable** | Every evaluation produces a human-readable explanation. "Blocked" is never an acceptable output. "Blocked because [specific reason with data]" is required. |
| **Auditable** | Every evaluation is logged with inputs, outputs, framework version, and timestamp. Users can review their complete compliance history. |
| **Configurable** | Framework rules (thresholds, exclusions, weights) are data-driven, not hardcoded. Administrators and future users can adjust parameters without code changes. |

### 8.4 Evaluation Output Contract

Every framework evaluation produces a structured result:

```
ComplianceEvaluation {
  frameworkId:       string          // e.g., "halal-v1"
  frameworkName:     string          // e.g., "Halal Investing Framework"
  assetId:           string          // e.g., "AAPL"
  verdict:           COMPLIANT | NON_COMPLIANT | PARTIALLY_COMPLIANT | INSUFFICIENT_DATA
  overallScore:      number          // 0.0 - 1.0
  evaluatedAt:       ISO8601         // Timestamp of evaluation
  rules: [
    {
      ruleId:        string          // e.g., "debt-to-equity"
      ruleName:      string          // e.g., "Debt-to-Equity Ratio"
      threshold:     string          // e.g., "<= 0.33"
      actualValue:   string          // e.g., "0.21"
      passed:        boolean         // true
      explanation:   string          // Human-readable explanation
      dataSource:    string          // e.g., "Q3 2026 10-Q filing"
      severity:      CRITICAL | WARNING | INFO
    }
  ]
  industryCheck: {
    passed:          boolean
    industry:        string          // e.g., "Technology — Consumer Electronics"
    excludedList:    string[]        // Industries this framework excludes
    explanation:     string
  }
  recommendations:   string[]       // Actionable suggestions for the user
  educationalNotes:  string[]       // Contextual learning content
}
```

This contract ensures that the UI can render rich, detailed compliance cards without any framework-specific rendering logic. Every framework produces the same shape of output. The UI is framework-agnostic.

---

## 9. Product Principles

These principles are ranked. When principles conflict, higher-ranked principles take precedence.

### Principle 1 — Explain Everything

**Never say "Blocked." Always explain "Blocked because..."**

This is the highest-priority principle. If any part of the system produces an outcome without an explanation, the system is broken. This applies to:

- Compliance decisions ("This stock is non-compliant because...")
- Trade rejections ("This order cannot be executed because...")
- Portfolio warnings ("Your portfolio's Halal compliance score dropped because...")
- Search results ("This stock doesn't appear because...")
- System errors ("Something went wrong. Here's what we know...")

Explanations must be:
- **Specific** — Reference actual data, actual thresholds, actual rules
- **Actionable** — Tell the user what they could do differently
- **Educational** — Help the user understand the underlying concept

### Principle 2 — Teach Through Usage

Education is not a section of the product. It is a property of the product.

Every interaction is an opportunity to teach. When a user views a compliance report, they should learn what debt-to-equity ratio means. When they place a trade, they should learn how market orders differ from limit orders. When they switch frameworks, they should learn why different investors care about different metrics.

Education should be:
- **Contextual** — Appear at the moment of relevance, not in a separate "Learn" tab
- **Progressive** — Start simple, reveal complexity as the user demonstrates readiness
- **Non-blocking** — Never force the user to read a lesson before taking an action
- **Memorable** — Use their own portfolio data to illustrate concepts

### Principle 3 — Transparency Over Mystery

Users should understand:

- **Compliance decisions** — Every rule that was evaluated, every threshold, every data point
- **Portfolio decisions** — Why their portfolio score changed, what drove performance
- **Trade decisions** — What happened to their order, when, and why
- **System behavior** — No black boxes, no unexplained states, no silent failures

Transparency builds trust. Trust builds retention. Retention builds business viability.

### Principle 4 — Framework Agnostic

The platform supports multiple investing frameworks. The platform itself has no opinion on which framework is "correct." The Halal framework is the flagship, but the architecture treats all frameworks equally. A user running the ESG framework should have the same depth of experience as a user running the Halal framework.

This principle has architectural implications:
- No framework-specific code in the trading engine
- No framework-specific UI components (all compliance UI is driven by the evaluation output contract)
- No framework-specific database schemas (all frameworks use the same data model)

### Principle 5 — Fast By Default

Every interaction should feel responsive. Perceived performance is more important than actual performance.

| Interaction | Target |
|---|---|
| Page navigation | < 100ms (perceived, via prefetching) |
| Search results | < 200ms to first result |
| Trade execution | < 300ms to confirmation |
| Compliance evaluation | < 500ms for full report |
| Portfolio load | < 400ms for dashboard |

These are not aspirational. They are requirements. If a feature cannot meet these targets, it needs architectural redesign, not just optimization.

### Principle 6 — Simplicity Over Complexity

Avoid unnecessary complexity in code, UI, and product decisions. This does not mean building simple features. It means building complex features with simple interfaces. The Compliance Framework Engine is architecturally complex. Its user-facing presentation should be immediately understandable.

The test: if a first-time user cannot understand a feature within 10 seconds of seeing it, the feature's presentation has failed.

---

## 10. Compliance Framework Architecture Philosophy

### 10.1 Core Tenets

| Tenet | Description |
|---|---|
| **Frameworks are plugins, not features** | The engine doesn't know what frameworks exist at compile time. Frameworks register themselves at runtime. |
| **Frameworks are data, not code** | Framework rules, thresholds, and exclusions are stored as configuration. Adding a new rule does not require a code deployment. |
| **Frameworks are independent** | The Halal framework cannot see or affect the ESG framework. Frameworks operate in isolation. |
| **Frameworks are versioned** | Rules change. A compliance evaluation from January must reference the exact rule version that was active in January. |
| **Frameworks are optional** | A user can trade with the Standard framework (no compliance filtering). The system doesn't force compliance on anyone. |
| **The engine is the product** | The paper trading engine is infrastructure. The Compliance Framework Engine is the product. Invest accordingly. |

### 10.2 Separation from Trading Engine

The Compliance Framework Engine operates independently from the paper trading engine. This separation is critical:

- The trading engine handles order lifecycle: validation, execution, settlement, position tracking
- The compliance engine handles decision evaluation: rule checking, scoring, explanation generation
- Communication between them happens through well-defined contracts
- Either engine can be replaced, upgraded, or scaled independently

---

## 11. Initial Frameworks

### 11.1 Standard Framework

The Standard Framework applies no compliance filtering. All publicly traded stocks are eligible. All trade types are allowed. This framework exists for users who want a pure simulation experience without compliance evaluation.

Even under the Standard Framework, the Compliance Framework Engine is active — it simply returns `COMPLIANT` for every evaluation. This ensures the engine's code path is always exercised, enabling consistent performance characteristics and simplifying testing.

### 11.2 Halal Investing Framework

The Halal Investing Framework is the flagship compliance framework. It demonstrates the full power of the engine: financial ratio evaluation, industry exclusions, configurable thresholds, detailed explanations, and educational content.

See §13 for the deep dive.

---

## 12. Future Frameworks

The following frameworks are planned for post-MVP phases. Each demonstrates a different dimension of the engine's flexibility:

| Framework | Description | Demonstrates |
|---|---|---|
| **ESG Framework** | Environmental, Social, and Governance scoring | Multi-dimensional scoring (not just pass/fail) |
| **Dividend Framework** | Filters for dividend-paying stocks with yield thresholds | Quantitative screening with financial data |
| **Value Investing Framework** | Warren Buffett-style rules (P/E, P/B, margin of safety) | Complex multi-metric evaluation |
| **Low Debt Framework** | Restricts to companies below specific leverage ratios | Simple rule sets as a gateway for new users |
| **Growth Framework** | Favors companies with high revenue and earnings growth | Time-series data evaluation |
| **Custom User Frameworks** | Users define their own rules and thresholds | Framework builder UI; maximum extensibility |
| **Community Frameworks** | Shared frameworks published by the community | Social features; framework marketplace |
| **Institutional Frameworks** | Frameworks defined by financial institutions | B2B monetization pathway |

Each future framework validates that the engine is genuinely pluggable — not just claimed to be.

---

## 13. Halal Investing Framework — Flagship Deep Dive

### 13.1 Purpose

The Halal Investing Framework serves two roles:

1. **Product role** — It addresses a real, underserved market of Muslim investors who need transparent, explainable Shariah-compliant investing tools
2. **Architecture role** — It is the most complex framework at launch, stress-testing the engine's ability to handle financial ratio evaluation, industry classification, configurable thresholds, and rich educational content

### 13.2 Important Brand Note

The platform itself should **not** be branded solely around Halal investing. Halal investing is presented as one supported framework among many. The platform's identity is framework-agnostic. This protects the brand's ability to serve ESG investors, value investors, and any future community.

### 13.3 Halal Framework Rules

All rules are configurable. The values below are defaults aligned with common Shariah screening standards (AAOIFI-inspired):

| Rule ID | Rule Name | Condition | Default Threshold | Severity |
|---|---|---|---|---|
| `halal-debt-equity` | Debt-to-Equity Ratio | Total Debt / Total Equity | ≤ 0.33 (33%) | CRITICAL |
| `halal-receivables` | Trade Receivables | Accounts Receivable / Market Capitalization | ≤ 0.45 (45%) | CRITICAL |
| `halal-interest-income` | Interest Income | Interest Income / Total Revenue | ≤ 0.05 (5%) | CRITICAL |
| `halal-other-income` | Impermissible Other Income | Non-operating Non-compliant Income / Total Revenue | ≤ 0.05 (5%) | WARNING |
| `halal-industry` | Industry Exclusion | Company's primary industry classification | Not in exclusion list | CRITICAL |

### 13.4 Industry Exclusions

The following industries are excluded by default. The list is configurable:

| Excluded Industry | Rationale |
|---|---|
| Conventional Banking & Finance | Interest-based revenue model |
| Alcohol Production & Distribution | Prohibited substance |
| Gambling & Casinos | Prohibited activity |
| Tobacco Production | Harmful substance |
| Adult Entertainment | Prohibited content |
| Weapons & Defense (Controversial) | Configurable; some scholars permit |
| Pork Processing | Prohibited substance |
| Conventional Insurance | Interest and uncertainty (gharar) |

### 13.5 Example Evaluation Output

For a stock like **Apple Inc. (AAPL)**:

```
Verdict: COMPLIANT ✓
Overall Score: 0.92

Rules Evaluated:
  ✓ Debt-to-Equity: 1.87T / 62.15B = 0.30 (threshold: ≤ 0.33) — PASSED
     "Apple's total debt relative to shareholder equity is within
      the Halal framework's limit. A ratio below 0.33 indicates
      the company is not excessively leveraged by Shariah standards."

  ✓ Trade Receivables: 60.93B / 3.45T = 0.018 (threshold: ≤ 0.45) — PASSED
     "Apple's accounts receivable represent only 1.8% of its market
      capitalization, well within the 45% threshold."

  ✓ Interest Income: 3.93B / 394.33B = 0.010 (threshold: ≤ 0.05) — PASSED
     "Interest income is approximately 1% of total revenue,
      within the 5% tolerance."

  ✓ Other Income: Negligible — PASSED
     "No significant impermissible non-operating income identified."

  ✓ Industry: Technology — Consumer Electronics — NOT EXCLUDED
     "Apple's primary industry is consumer electronics technology,
      which is not on the Halal framework's exclusion list."

Recommendations:
  - "Apple is currently compliant. Monitor the debt-to-equity ratio
     quarterly — it's at 0.30, close to the 0.33 threshold."

Educational Notes:
  - "The Halal framework's debt threshold is based on the principle
     that excessive borrowing with interest (riba) should be avoided.
     The 33% ratio comes from Hadith-based scholarly guidance."
```

### 13.6 Why This Framework Matters for Recruiter Evaluation

The Halal framework demonstrates:

- **Domain modeling** — Financial ratios, industry classification, configurable rules
- **Explainability engineering** — Every rule produces human-readable output
- **Data pipeline design** — Framework rules consume financial data from external APIs
- **Separation of concerns** — Framework logic is completely isolated from trade execution
- **Configuration-driven architecture** — Thresholds are data, not code

---

## 14. Target Users

### 14.1 Primary Segments

| Segment | Description | Why They Care |
|---|---|---|
| **Students** | University students in finance, economics, or business programs | Need a risk-free environment to practice investing concepts learned in class |
| **Beginner Investors** | Adults with savings who want to start investing but fear losing money | Need a safe space to build confidence before committing real capital |
| **Muslim Investors** | Investors who want to ensure Shariah compliance in their portfolio | Need transparent, explainable compliance screening — currently underserved |
| **Retail Investors** | Active self-directed investors exploring different strategies | Want to backtest and compare frameworks before applying them with real money |
| **Investing Enthusiasts** | Hobbyist investors who enjoy learning about markets | Want depth, data density, and intellectual engagement |
| **Financial Learners** | Anyone trying to improve their financial literacy | Want contextual education that's tied to real data, not textbook examples |

### 14.2 Future Segments

| Segment | When | Description |
|---|---|---|
| **Communities** | Phase 3+ | Groups of investors sharing frameworks, portfolios, and strategies |
| **Financial Educators** | Phase 3+ | Teachers and mentors using the platform as a classroom tool |
| **Institutional Compliance Teams** | Phase 4+ | Organizations evaluating custom compliance frameworks at scale |

---

## 15. User Types & Access Model

| User Type | Capabilities | Notes |
|---|---|---|
| **Guest** | Browse stock listings, view public compliance reports, explore framework descriptions | No account required. Conversion funnel entry point. |
| **Registered User** | Full paper trading, portfolio management, framework selection, compliance history, personalized dashboard | Authenticated via Auth.js (Google OAuth or email/password) |
| **Admin** | User management, system health monitoring, framework administration, data management | Internal-only. Not part of the public product surface. |

### 15.1 Access Model Principles

- Guest access is generous. The goal is to demonstrate value before requiring registration.
- Registration is low-friction. Google OAuth is the primary path. Email/password is the fallback.
- Admin capabilities are not overengineered at MVP. Basic CRUD and health monitoring are sufficient.
- Role-based access control (RBAC) is designed from day one even if only three roles exist initially.

---

## 16. UX Philosophy

### 16.1 The Interface Should Feel

| Quality | What It Means in Practice |
|---|---|
| **Professional** | No visual artifacts that suggest this is a hobby project. Typography, spacing, color, and layout should meet the standard of commercial fintech products. |
| **Premium** | Subtle details — shadow quality, border radius consistency, transition timing, icon alignment — that signal craft and intention. |
| **Focused** | Every screen has a primary task. Secondary information is available but not competing for attention. |
| **Reliable** | No layout shifts. No broken states. No empty screens without guidance. Error states are designed, not afterthoughts. |
| **Fast** | Perceived speed through skeleton screens, optimistic updates, and prefetched routes. Users should never see a spinner for more than 300ms on core flows. |
| **Intentional** | Every element on the screen earns its place. If you can't explain why a component exists, remove it. |

### 16.2 The Interface Should NOT Feel

| Anti-Quality | What to Avoid |
|---|---|
| **AI Generated** | No generic layouts, stock photos, or lorem ipsum. Every screen is purposefully designed. |
| **Template Based** | No recognizable SaaS templates. The design language is unique to this product. |
| **Student Project** | No inconsistent spacing, misaligned elements, or amateur color choices. |
| **Overdesigned** | No gratuitous animation, excessive gradients, or decorative elements that don't serve function. |
| **Gimmicky** | No "wow factor" features that add visual noise without information value. |

### 16.3 Motion Principles

| Principle | Detail |
|---|---|
| **Subtle** | Motion should be felt, not seen. Users should notice if you remove it, not if you add it. |
| **Purposeful** | Every animation communicates something: state change, spatial relationship, or feedback. |
| **Fast** | Transition durations: 100-200ms for micro-interactions, 200-350ms for layout transitions, never > 500ms. |
| **Micro-interactions preferred** | Button presses, toggle switches, hover states, loading indicators. Not page-level choreography. |

Avoid: heavy animation, unnecessary motion, visual noise, scroll-jacking, parallax effects.

---

## 17. Design References & Influences

These products are studied for their strengths. **None are cloned.**

| Reference | What to Learn |
|---|---|
| **TradingView** | Information density. Data-rich layouts that remain scannable. Chart interaction patterns. |
| **Zerodha Kite** | Simplicity in a complex domain. Clean order placement flows. Performance-first design. |
| **Groww** | Onboarding for beginners. Approachable visual language. Mobile-first thinking. |
| **Robinhood** | Emotional design. Celebration moments. Accessibility of complex financial data. |
| **Linear** | Keyboard-first navigation. Command palette. Minimal chrome. Task-focused layouts. |
| **Stripe Dashboard** | Data tables. Settings pages. Developer-friendly information architecture. |
| **Vercel Dashboard** | Dark mode execution. Status indicators. Deployment-style activity feeds. |
| **Arc Browser** | Spatial organization. Tab management. Novel interaction patterns. |

### 17.1 Design Principle Synthesis

From these references, synthesize:

- **Information density** from TradingView — without visual overload
- **Simplicity** from Zerodha — without being simplistic
- **Approachability** from Groww — without patronizing experienced users
- **Delight** from Robinhood — without being gimmicky
- **Keyboard-first** from Linear — without alienating mouse users
- **Data clarity** from Stripe — without being developer-only
- **Dark mode craft** from Vercel — without making dark mode a gimmick
- **Novel UX** from Arc — without confusing first-time users

Create a **unique product identity** that doesn't remind users of any single reference.

---

## 18. Technical Stack Overview

### 18.1 Frontend

| Technology | Role | Rationale |
|---|---|---|
| **Next.js** | React framework | Server-side rendering, route prefetching, API routes, middleware, image optimization |
| **TypeScript** | Language | Type safety from component props to API calls. Non-negotiable. |
| **TailwindCSS** | Styling | Utility-first CSS for rapid, consistent styling. Design token integration via config. |
| **Shadcn UI** | Component primitives | Accessible, unstyled primitives that can be themed to match the design system. Not a pre-built UI kit. |
| **TanStack Query** | Server state | Caching, background refetching, optimistic updates, query invalidation. |
| **Zustand** | Client state | Minimal, performant client-side state for UI concerns (modals, preferences, local filters). |
| **TradingView Lightweight Charts** | Charting | Professional-grade financial charts. Open source. Performant. |

### 18.2 Backend

| Technology | Role | Rationale |
|---|---|---|
| **NestJS** | Application framework | Modular architecture, dependency injection, decorators, strong TypeScript support. Ideal for DDD. |
| **TypeScript** | Language | Shared types with frontend. End-to-end type safety. |
| **PostgreSQL** | Primary database | ACID compliance, JSON support, mature ecosystem, excellent for financial data. |
| **Prisma** | ORM | Type-safe database access, migration management, schema-driven development. |

### 18.3 Infrastructure

| Technology | Role | Rationale |
|---|---|---|
| **Docker** | Containerization | Consistent development and deployment environments. |
| **GitHub Actions** | CI/CD | Automated testing, linting, building, and deployment pipelines. |

### 18.4 Authentication

| Technology | Role | Rationale |
|---|---|---|
| **Auth.js (NextAuth)** | Authentication framework | Supports multiple providers, session management, JWT/database sessions. |
| **Google OAuth** | Primary login | Low-friction registration. Most users have a Google account. |
| **Email/Password** | Secondary login | Fallback for users without Google or those who prefer email auth. |

---

## 19. Architecture Principles

### 19.1 Preferred Patterns

| Principle | Description |
|---|---|
| **Modular Monolith** | A single deployable unit with strict module boundaries. Modules communicate through defined interfaces, not direct imports. Enables future service extraction without upfront microservice complexity. |
| **Domain-Driven Design (DDD)** | Business logic organized around domain concepts (Portfolio, Trade, Compliance, User), not technical layers. Each domain owns its models, services, and repositories. |
| **Layered Architecture** | Within each module: Controller → Service → Repository. Dependencies flow inward. Outer layers depend on inner layers. Never the reverse. |
| **Strong Type Safety** | TypeScript strict mode everywhere. No `any`. Prisma-generated types for database access. Validated DTOs for API boundaries. Shared type packages where appropriate. |
| **Strong Contracts** | API contracts are defined explicitly. Changes to contracts require versioning. Frontend and backend agree on types at compile time where possible. |
| **Extensibility** | New frameworks, new order types, new data sources can be added without modifying existing code (Open/Closed Principle). |
| **Maintainability** | Code should be readable by a new team member within one day. Prefer explicit over clever. Prefer boring technology over exciting technology. |
| **Scalability** | Design for 10x current load without re-architecture. Don't optimize for 100x until you need to. |
| **Observability** | Every system boundary emits structured logs. Key operations are traced. Health checks are comprehensive. Errors are actionable. |

### 19.2 Explicit Avoidances

| Anti-Pattern | Why We Avoid It |
|---|---|
| **Microservices** | Adds network complexity, operational overhead, and distributed system problems that a small team cannot sustain at this stage. The modular monolith gives us service boundaries without the deployment complexity. |
| **Premature Optimization** | Optimize after profiling, not before coding. Readability and correctness come first. |
| **Overengineering** | Build for the requirements we have, not the requirements we imagine. The architecture should be extensible (easy to add to) but not speculative (built for hypothetical futures). |

---

## 20. Performance Principles

| Principle | Frontend Implementation | Backend Implementation |
|---|---|---|
| **Fast search** | Debounced input, cached results, instant UI feedback | Indexed database queries, materialized views for search |
| **Fast navigation** | Next.js route prefetching, code splitting, skeleton screens | Lightweight API responses, pagination |
| **Minimal loading states** | Optimistic updates, stale-while-revalidate, cached first paint | Fast cold-start queries, connection pooling |
| **Optimized rendering** | Virtualized lists, memoized components, lazy-loaded charts | Efficient serialization, response compression |
| **Efficient caching** | TanStack Query cache, localStorage for preferences | Redis for hot data, HTTP cache headers, CDN |
| **Low latency interactions** | < 100ms for UI feedback, < 300ms for server round-trip | Query optimization, connection pooling, indexing strategy |

---

## 21. Non-Goals & Explicit Exclusions

Non-goals are as important as goals. They prevent scope creep and keep the team focused.

| Non-Goal | Rationale |
|---|---|
| **Not a broker** | Brokerage requires licensing, regulatory compliance, and liability that is incompatible with the product's educational mission and development stage. |
| **Not a real-money trading platform** | Virtual trading only. No payment processing for trades. No order routing. |
| **Not a crypto exchange** | Cryptocurrency markets have fundamentally different data sources, compliance requirements, and user expectations. Out of scope entirely. |
| **Not a clone of another product** | The Compliance Framework Engine is the differentiator. If the product can be described as "X but for Y," it has failed. |
| **Not a religious website** | The platform is secular technology. The Halal framework is one compliance module. The product serves all investors regardless of religious affiliation. |

---

## 22. Long-Term Product Vision

The product should eventually become a **complete investing ecosystem**. The MVP is the first layer.

| Future Area | Description | Dependency |
|---|---|---|
| **Learning Hub** | Structured courses, interactive lessons, certification paths | Content creation pipeline, user progress tracking |
| **Portfolio Analysis** | Advanced analytics — risk metrics, diversification scoring, benchmark comparison | Historical data storage, computation engine |
| **Compliance APIs** | RESTful APIs allowing third parties to evaluate assets against frameworks | API gateway, rate limiting, authentication, usage billing |
| **Educational Services** | White-label compliance education for financial institutions | Multi-tenant architecture, content management |
| **Community Investing** | Shared portfolios, framework marketplace, social features | User-generated content moderation, social graph |
| **Mobile Applications** | Native iOS and Android apps | React Native or separate native development |
| **AI Assistance** | Natural-language compliance queries, portfolio suggestions, anomaly detection | LLM integration, guardrails, explainability requirements |

---

## 23. Success Criteria

A recruiter — or any first-time user — should be able to complete the following journey within 10 minutes:

| Step | Action | What It Demonstrates |
|---|---|---|
| 1 | **Search stocks** | Search infrastructure, autocomplete performance, market data integration |
| 2 | **Understand frameworks** | Information architecture, educational content quality, framework explainability |
| 3 | **Enable Halal Mode** | Framework switching, real-time compliance re-evaluation, UI state management |
| 4 | **See compliance explanations** | The Compliance Framework Engine in action — the core product |
| 5 | **Execute paper trades** | Order management, trade execution, position tracking |
| 6 | **Manage a portfolio** | Portfolio dashboard, P&L tracking, compliance status overview |
| 7 | **Understand the architecture** | Documentation quality, code organization, system design visibility |

**The Compliance Framework Engine should be the most memorable feature.** If a recruiter remembers one thing about this project, it should be the engine.

---

## 24. Recruiter Goals

This project is also a portfolio piece. It should demonstrate mastery across the full stack:

| Skill Area | How the Project Demonstrates It |
|---|---|
| **Advanced Frontend Engineering** | Complex state management, real-time data, accessible components, performance optimization, animation system |
| **Advanced Backend Engineering** | Modular monolith, DDD, plugin architecture, transactional consistency, background job processing |
| **System Design** | Compliance engine architecture, event-driven patterns, extensibility without overengineering |
| **Database Design** | Normalized schema, indexing strategy, migration management, query optimization |
| **API Design** | RESTful contracts, versioning, error handling, pagination, filtering |
| **Performance Engineering** | Sub-200ms interactions, caching layers, query optimization, bundle optimization |
| **Product Thinking** | Clear problem definition, user personas, competitive differentiation, MVP scoping |
| **Fintech Domain Understanding** | Financial ratios, compliance rules, market data, order lifecycle, portfolio management |
| **Architecture Skills** | Separation of concerns, plugin systems, clean boundaries, testable design |
| **Scalability Planning** | Designed for growth without premature optimization; clear scaling pathways documented |

---

## 25. Tradeoffs

Every architectural and product decision involves tradeoffs. Documenting them explicitly prevents revisiting settled decisions.

| Decision | Chosen Option | Alternative | Why |
|---|---|---|---|
| **Monolith vs. Microservices** | Modular Monolith | Microservices | Small team, shared database, no operational overhead for service mesh. Module boundaries allow future extraction. |
| **SSR vs. SPA** | Next.js (SSR + CSR hybrid) | Pure SPA (Vite) | SEO for public pages, faster first paint, API routes for BFF pattern. Slightly more complexity than pure SPA. |
| **Prisma vs. Raw SQL** | Prisma | TypeORM / Raw SQL | Type-safe queries, migration management, schema-driven development. Tradeoff: less control over complex queries, but raw SQL escape hatch exists. |
| **NestJS vs. Express** | NestJS | Express / Fastify | DDD-friendly module system, dependency injection, decorator-based routing. Tradeoff: steeper learning curve, more boilerplate. |
| **Auth.js vs. Custom Auth** | Auth.js | Custom JWT implementation | Battle-tested, multi-provider support, session management. Tradeoff: less control over auth flow, dependency on library updates. |
| **TailwindCSS vs. CSS Modules** | TailwindCSS | CSS Modules / Styled Components | Rapid development, design token integration, consistent utility classes. Tradeoff: className verbosity, learning curve. |
| **PostgreSQL vs. MongoDB** | PostgreSQL | MongoDB | Financial data is inherently relational. ACID transactions for trade execution. JSON columns available when document flexibility is needed. |
| **Virtual trading only** | No real money | Real money integration | Eliminates regulatory burden, liability, and payment infrastructure. Focuses the product on education and framework evaluation. |

---

## 26. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Market data API reliability** | High | Medium | Multiple data provider fallback, caching layer, graceful degradation with stale data indicators |
| **Market data API cost** | Medium | High | Aggressive caching (15-min delay acceptable for paper trading), tiered data freshness, free-tier API providers for MVP |
| **Compliance framework accuracy** | High | Medium | Clearly label as "educational, not financial advice." Version and audit all framework rules. Allow user-configurable thresholds. |
| **User adoption** | Medium | Medium | Focus on Halal investing community first (underserved, high motivation). Generous guest access to reduce registration friction. |
| **Scope creep** | High | High | Strict Non-Goals enforcement. MVP scope is documented and immutable without Product + Engineering sign-off. |
| **Single developer bottleneck** | High | High | Comprehensive documentation, clean architecture, automated testing. Any competent developer should be able to onboard within one week. |
| **Performance degradation at scale** | Medium | Low | Performance budgets enforced in CI. Load testing before each phase completion. Caching strategy designed from day one. |
| **Framework rule disputes** | Low | Medium | Frameworks are configurable. Default rules are based on published standards (e.g., AAOIFI). Users can adjust thresholds. Platform does not endorse any framework as "correct." |

---

## 27. Future Expansion

The architecture is designed with specific expansion vectors in mind:

| Expansion Vector | Architectural Support | When |
|---|---|---|
| **New Compliance Frameworks** | Plugin registration system. No core code changes required. | Each new phase |
| **Mobile Applications** | API-first backend design. All business logic is in the API layer, not the Next.js frontend. | Phase 4+ |
| **Real-time Market Data** | WebSocket infrastructure planned. Current polling architecture can be upgraded without API contract changes. | Phase 3+ |
| **Multi-tenant SaaS** | Module boundaries support tenant isolation. Database design accommodates organization-level partitioning. | Phase 5+ |
| **Compliance API Marketplace** | Framework evaluation endpoints are already API-accessible. Rate limiting and billing can be layered on. | Phase 4+ |
| **AI Integration** | Compliance evaluation output is structured and machine-readable. LLM-powered explanations can augment rule-based explanations. | Phase 5+ |
| **Internationalization** | String externalization planned from MVP. Date/number formatting via Intl API. RTL support for Arabic-speaking users. | Phase 3+ |

---

## 28. Dependencies

### 28.1 External Dependencies

| Dependency | Type | Risk Level | Notes |
|---|---|---|---|
| **Market Data API** (e.g., Alpha Vantage, Polygon.io, Yahoo Finance) | Data source | High | Core product requirement. Must have fallback provider. |
| **Financial Fundamentals API** (e.g., Financial Modeling Prep) | Data source | High | Required for compliance evaluation (debt ratios, revenue breakdowns). |
| **Google OAuth** | Authentication | Low | Widely available, well-documented, high reliability. |
| **Vercel / Railway** (deployment) | Infrastructure | Low | Commodity hosting. Easy to migrate between providers. |
| **GitHub** | Source control & CI/CD | Low | Industry standard. Low switching cost. |

### 28.2 Internal Dependencies

| Dependency | Owner | Notes |
|---|---|---|
| **Design System** | Design/Frontend | Must be established before component development begins (see `06-design-system.md`) |
| **Domain Models** | Backend/Architecture | Must be finalized before database schema and API design (see `09-domain-models.md`) |
| **API Contracts** | Full-stack | Must be agreed upon before parallel frontend/backend development (see `13-api-design.md`) |
| **Compliance Framework Schema** | Architecture | Must be defined before framework implementation (see `14-compliance-engine.md`) |

---

## 29. Engineering Notes

### 29.1 Development Philosophy

- **Ship incrementally.** Every commit should leave the system in a deployable state. Feature flags over long-lived branches.
- **Test what matters.** Unit tests for business logic (compliance rules, trade execution). Integration tests for API contracts. E2E tests for critical user journeys. Don't test implementation details.
- **Automate everything repeatable.** Linting, formatting, type checking, test execution, deployment — all in CI. No manual gates.
- **Document decisions, not just code.** ADRs (Architecture Decision Records) for significant choices. Comments for "why," not "what."

### 29.2 Code Quality Standards

| Standard | Enforcement |
|---|---|
| TypeScript strict mode | `tsconfig.json` — `"strict": true` |
| No `any` types | ESLint rule: `@typescript-eslint/no-explicit-any` |
| Consistent formatting | Prettier with project config |
| Import ordering | ESLint plugin: `import/order` |
| No unused variables | TypeScript compiler: `noUnusedLocals`, `noUnusedParameters` |
| Test coverage threshold | >80% for business logic modules |

### 29.3 Git Workflow

- `main` — Production-ready. Protected. Merge via PR only.
- `develop` — Integration branch. CI must pass.
- `feature/*` — Short-lived feature branches from `develop`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Squash merge to keep history clean.

---

## 30. Business Impact Notes

### 30.1 Market Opportunity

The Compliance Framework Engine positions this product in a genuinely unoccupied space:

- **Islamic finance** is a ~$4.5 trillion market globally, growing at ~10% annually
- **ESG investing** is a ~$40 trillion market with increasing regulatory pressure
- **Value investing education** has massive demand but few interactive tools
- **Custom compliance** is an emerging enterprise need as regulations proliferate

No existing product offers a pluggable, explainable compliance framework engine for virtual investing. This is not a marginal improvement on existing products — it is a new category.

### 30.2 Monetization Pathways

| Pathway | Model | Phase |
|---|---|---|
| **Freemium** | Free tier with Standard + Halal frameworks; premium frameworks as paid add-ons | Phase 3+ |
| **Compliance API** | Per-call or subscription API access for third-party developers | Phase 4+ |
| **Institutional Licensing** | White-label compliance engine for financial institutions | Phase 5+ |
| **Educational Partnerships** | Platform licensing for universities and bootcamps | Phase 4+ |
| **Community Marketplace** | Revenue share on community-published frameworks | Phase 5+ |

### 30.3 Why This Business Can Work

1. **Underserved market** — Muslim investors have few transparent, modern tools for Shariah compliance
2. **Extensible to adjacent markets** — ESG, Value, Growth frameworks serve entirely different user bases with the same infrastructure
3. **API-first architecture** — The compliance engine can be monetized as a standalone service
4. **Low marginal cost** — Adding a new framework is a configuration exercise, not a development project
5. **Network effects** — Community frameworks create a marketplace dynamic where value increases with users

---

## 31. Recruiter Impact Notes

### 31.1 What Makes This Project Stand Out

Most portfolio projects are CRUD applications with a UI skin. This project demonstrates:

| Dimension | Evidence |
|---|---|
| **Original product thinking** | A genuinely novel product concept, not a clone of an existing app |
| **Domain complexity** | Financial data, compliance rules, trade lifecycle — not a todo list |
| **Architectural maturity** | Plugin systems, modular monolith, DDD — not a flat Express app |
| **Full-stack depth** | Complex frontend (charts, real-time data, accessibility) + complex backend (compliance engine, trade execution, caching) |
| **Production quality** | Observability, error handling, performance budgets, security — not just "it works on my machine" |
| **Documentation rigor** | 25 detailed documents covering product, design, engineering, and business |

### 31.2 Talking Points for Interviews

- "I built a pluggable compliance framework engine that evaluates trades against configurable investment rules — like a plugin system for investing philosophies."
- "The architecture is a modular monolith with DDD boundaries. Each domain (Compliance, Trading, Portfolio, Market Data) has its own module with strict interface contracts."
- "Every compliance decision produces a structured explanation. The UI renders these explanations without any framework-specific code — it's completely driven by the evaluation output contract."
- "The Halal investing framework is the flagship, but the architecture supports any framework expressible as rules + thresholds + exclusions. Adding ESG support is a configuration exercise."

---

## 32. Document Cross-References

This document is the foundation. All other documents in the suite derive from it:

| Document | Relationship to Product Foundation |
|---|---|
| `01-market-opportunity.md` | Expands on §30.1 — quantifies the market opportunity |
| `02-competitive-analysis.md` | Expands on §7.3 — detailed competitive positioning |
| `03-user-personas.md` | Expands on §14 — full persona profiles with demographics and behaviors |
| `04-user-journeys.md` | Expands on §23 — step-by-step user flows for each persona |
| `05-information-architecture.md` | Derives from §16 — site map, navigation, content hierarchy |
| `06-design-system.md` | Derives from §16, §17 — tokens, typography, color, components |
| `07-page-inventory.md` | Derives from §3.1 — complete page list with purpose and priority |
| `08-component-library.md` | Derives from `06` — component specifications with props and states |
| `09-domain-models.md` | Derives from §8.4, §13 — TypeScript domain model definitions |
| `10-database-design.md` | Derives from `09` — PostgreSQL schema, indexes, migrations |
| `11-backend-architecture.md` | Derives from §18.2, §19 — NestJS module structure, DDD boundaries |
| `12-frontend-architecture.md` | Derives from §18.1, §16 — Next.js structure, state management, routing |
| `13-api-design.md` | Derives from §19.1 — REST endpoints, contracts, versioning |
| `14-compliance-engine.md` | Expands on §8 — full engine specification, plugin API, rule schema |
| `15-paper-trading-engine.md` | Expands on §3.1 — order lifecycle, execution model, settlement |
| `16-market-data-system.md` | Derives from §28.1 — data provider integration, caching, normalization |
| `17-security.md` | Cross-cutting — authentication, authorization, data protection, OWASP |
| `18-observability.md` | Derives from §19.1 — logging, tracing, monitoring, alerting |
| `19-mvp-definition.md` | Derives from §3.1 — exact MVP feature set with acceptance criteria |
| `20-future-roadmap.md` | Expands on §22, §27 — phased vision with timelines and milestones |
| `21-monetization.md` | Expands on §30.2 — pricing models, revenue projections, unit economics |
| `22-recruiter-highlights.md` | Expands on §24, §31 — curated highlights for technical evaluation |
| `23-implementation-phases.md` | Operationalizes §3.1 — detailed phase plans with acceptance criteria |
| `24-project-naming.md` | Derives from §4.1 — brand exploration, naming candidates, guidelines |

---

> **End of Document**
>
> This document should be reviewed and updated at each major phase milestone. Changes require Product + Engineering leadership approval.
