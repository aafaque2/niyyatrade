# 03 — User Personas

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Product & UX Design
> **Audience:** Engineering, Product, Design, Marketing, Recruiters
> **Depends On:** `00-product-foundation.md`, `01-market-opportunity.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Persona 1 (Primary Beachhead) — Amir, The Cautious Beginner](#5-persona-1-primary-beachhead--amir-the-cautious-beginner)
6. [Persona 2 (Primary Beachhead) — Fatima, The Analytical Investor](#6-persona-2-primary-beachhead--fatima-the-analytical-investor)
7. [Persona 3 (Secondary Expansion) — Sarah, The Values-Driven ESG Proponent](#7-persona-3-secondary-expansion--sarah-the-values-driven-esg-proponent)
8. [Persona 4 (Tertiary Expansion) — David, The Finance Student](#8-persona-4-tertiary-expansion--david-the-finance-student)
9. [Anti-Personas (Who We Are Not Building For)](#9-anti-personas-who-we-are-not-building-for)
10. [Feature-to-Persona Mapping Matrix](#10-feature-to-persona-mapping-matrix)
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

This document outlines the core user personas for HalalTrade (working name). User personas provide an empathetic, realistic anchor for product and engineering decisions. By defining exactly who we are building for, we ensure that every feature, UX choice, and architectural decision serves a specific, validated user need rather than an abstract technical ideal. 

Because HalalTrade is fundamentally an educational and compliance-aware investing operating system, understanding the users' varying levels of financial literacy and compliance sensitivity is critical.

### 1.1 Who Should Read This

| Audience | What They Gain |
|---|---|
| **Designers** | Empathy for the user's emotional state (e.g., anxiety around compliance) to design reassuring, clear interfaces |
| **Engineers** | Context on why certain features (like configurable thresholds and rule-by-rule explanations) are non-negotiable requirements |
| **Product Managers** | The lens through which to prioritize the roadmap and resolve scope debates |
| **Marketing** | The messaging and vocabulary needed to attract the beachhead audience |

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| UP-1 | Define the primary users driving early adoption | Clear, detailed profiles of the beachhead Halal investor |
| UP-2 | Define expansion users to validate the platform's multi-framework architecture | Detailed profiles of ESG and student users |
| UP-3 | Establish anti-personas to prevent scope creep | Explicit documentation of users the system will ignore |
| UP-4 | Map platform capabilities to specific persona pain points | A comprehensive matrix aligning engineering effort with user value |

---

## 3. Scope

### 3.1 In Scope
- Deep-dive profiles for the Halal beachhead market (Beginner and Analytical)
- Profiles for adjacent expansion markets (ESG and Students)
- Anti-personas (Day Traders, Institutional Quants)
- Behavioral traits, technical proficiency, and financial literacy mappings
- Alignment of personas to the Compliance Framework Engine capabilities

### 3.2 Out of Scope
- Granular marketing acquisition strategies (covered in Go-To-Market plans)
- Detailed step-by-step user journey maps (covered in `04-user-journeys.md`)

---

## 4. Executive Summary

HalalTrade is not a tool for everyone. At MVP, it is laser-focused on **Amir** (the cautious, Shariah-conscious beginner) and **Fatima** (the analytical, self-directed Muslim investor). These users are highly motivated but deeply underserved by current opaque screening apps. 

As the platform expands to prove its multi-framework capability, it will serve **Sarah** (the ESG proponent frustrated by black-box ratings) and **David** (the finance student needing practical, framework-based context).

Crucially, HalalTrade actively ignores day traders, crypto speculators, and professional institutional analysts. By defining who we are *not* building for, we protect the simplicity and educational focus of the platform.

---

## 5. Persona 1 (Primary Beachhead) — Amir, The Cautious Beginner

### 5.1 Profile
- **Age:** 24
- **Occupation:** Software Engineer
- **Location:** Chicago, IL (USA)
- **Financial Literacy:** Low to Medium
- **Tech Proficiency:** Very High
- **Current Tools:** Robinhood (browsing only), Zoya (free tier), Reddit (r/IslamicFinance)

### 5.2 The Narrative
Amir recently graduated, has a good salary, and knows he needs to start investing to beat inflation. However, he is paralyzed by the fear of investing in something *Haram* (impermissible). He downloaded Robinhood but hasn't funded it. He uses Zoya to look up stocks, but when Zoya says a stock is "Questionable," he doesn't understand the financial jargon behind the ruling. He wants to practice trading in a safe environment where he can learn the ropes without risking his savings or compromising his beliefs.

### 5.3 Pain Points & Frustrations
- **Fear of Mistakes:** Terrified of accidentally earning interest (Riba) or investing in non-compliant companies.
- **Jargon Overload:** Doesn't understand what "Debt-to-Equity" or "Trade Receivables" actually mean in the real world.
- **Fragmented Experience:** Dislikes looking up a stock on Zoya, reading about it on Investopedia, and then looking at a chart on Robinhood.

### 5.4 How HalalTrade Wins Amir
- **Safe Practice:** The paper trading engine allows Amir to buy and sell stocks with zero financial risk.
- **Explain Everything:** When Amir views a stock, the Compliance Engine doesn't just give a pass/fail. It provides plain-English explanations: *"Apple passes because its debt is only 30% of its equity (the Halal limit is 33%)."*
- **Integrated Learning:** Amir learns financial concepts contextually while navigating his virtual portfolio.

---

## 6. Persona 2 (Primary Beachhead) — Fatima, The Analytical Investor

### 6.1 Profile
- **Age:** 32
- **Occupation:** Healthcare Administrator
- **Location:** London (UK)
- **Financial Literacy:** Medium to High
- **Tech Proficiency:** High
- **Current Tools:** Wahed Invest, Islamicly (Premium), Interactive Brokers, Spreadsheets

### 6.2 The Narrative
Fatima is an active retail investor. She has a managed portfolio with Wahed Invest but likes to pick individual stocks on the side using a traditional brokerage. She is frustrated by the black-box nature of current screening apps. She knows that different Islamic scholars have slightly different thresholds for compliance (e.g., some say debt-to-equity must be < 30%, others say < 33%). She tracks her portfolio in a spreadsheet to ensure it remains compliant, which is tedious and error-prone.

### 6.3 Pain Points & Frustrations
- **Opaque Methodologies:** Dislikes when an app simply labels a stock "Non-Compliant" without showing the exact math or data source.
- **Rigid Rules:** Frustrated that she cannot adjust screening thresholds to match the specific scholarly opinion she follows.
- **Portfolio Auditing:** Tracking the ongoing compliance of her 15-stock portfolio is a manual, weekly chore.

### 6.4 How HalalTrade Wins Fatima
- **Configurable Frameworks:** Fatima can adjust the Halal Framework thresholds. If she wants a stricter < 30% debt rule, the engine instantly re-evaluates her entire portfolio based on her custom parameters.
- **Full Transparency:** She can see the exact data points (e.g., Q3 Total Assets, Q3 Total Debt) the engine used to make its decision.
- **Portfolio-Level Compliance:** The dashboard shows her aggregate portfolio compliance score and alerts her if a holding drifts into non-compliance due to a new earnings report.

---

## 7. Persona 3 (Secondary Expansion) — Sarah, The Values-Driven ESG Proponent

*(Targeted for Phase 3 — ESG Framework Launch)*

### 7.1 Profile
- **Age:** 29
- **Occupation:** Management Consultant
- **Location:** Toronto (Canada)
- **Financial Literacy:** Medium
- **Tech Proficiency:** High
- **Current Tools:** Wealthsimple, Morningstar, ESG reports

### 7.2 The Narrative
Sarah wants her investments to reflect her values. She cares deeply about climate change and corporate governance. She currently buys broad "ESG ETFs" but feels disillusioned because many of these ETFs still contain fossil fuel companies or tech giants with poor labor practices. She wants to build her own values-aligned portfolio but finds institutional ESG ratings (like Sustainalytics) confusing, contradictory, and inaccessible to retail investors.

### 7.3 Pain Points & Frustrations
- **Greenwashing:** Distrusts generic ESG labels on ETFs.
- **Black Box Scoring:** Doesn't understand why a company gets an "A" rating despite recent environmental controversies.
- **No Personalization:** She cares more about environmental impact than governance, but standard ESG ratings weigh them equally.

### 7.4 How HalalTrade Wins Sarah
- **Rule-by-Rule ESG Transparency:** The ESG Framework breaks down exactly how a company scores on specific metrics (e.g., Carbon footprint, Board diversity).
- **Framework Comparison:** Sarah can see how her portfolio shifts if she applies a strict Environmental filter vs. a broad ESG filter.
- **Actionable Simulation:** She can build a custom, highly ethical virtual portfolio, track its performance against the S&P 500, and gain the confidence to replicate it with real money later.

---

## 8. Persona 4 (Tertiary Expansion) — David, The Finance Student

*(Targeted for Phase 4 — Educational Partnerships)*

### 8.1 Profile
- **Age:** 21
- **Occupation:** University Student (Finance Major)
- **Location:** New York (USA)
- **Financial Literacy:** Medium (Academic but not practical)
- **Tech Proficiency:** High
- **Current Tools:** Bloomberg Terminal (at school), Investopedia Simulator, Yahoo Finance

### 8.2 The Narrative
David is taking a portfolio management class. His professor requires the class to participate in a paper trading competition using the Investopedia Simulator. David finds Investopedia clunky and outdated. More importantly, he is learning about different investment philosophies (Value investing, Growth investing, Ethical investing) in class, but the simulator just lets him buy and sell without applying any of these frameworks.

### 8.3 Pain Points & Frustrations
- **Dated Tools:** University-mandated simulators feel like they were built in the early 2000s.
- **Theory vs. Practice Disconnect:** He learns about the P/E ratio and Graham's Value principles in a textbook, but has no tool to systematically apply those rules to a simulated portfolio.

### 8.4 How HalalTrade Wins David
- **Modern UX:** A platform that feels like Stripe or Vercel, making him feel like he is using a professional tool.
- **Pluggable Philosophies:** David can switch the engine to the "Value Investing Framework" and immediately see which stocks in his portfolio violate Graham's principles and *why*.
- **Deep Analytics:** The educational explanations bridge the gap between his textbook and real-world market data.

---

## 9. Anti-Personas (Who We Are Not Building For)

Explicitly identifying who the product is *not* for is crucial for maintaining architectural simplicity and product focus.

| Anti-Persona | Description | Why We Exclude Them | Implications for Engineering/Design |
|---|---|---|---|
| **The Day Trader (Chad)** | Wants tick-by-tick data, Level 2 quotes, options trading, and margin. | HalalTrade is about long-term philosophy and compliance, not millisecond arbitrage. | We use delayed (15-min) data. No complex order types (options/futures). UI favors clarity over hyper-density. |
| **The Crypto Degen (Zack)** | Wants to trade meme coins, use 100x leverage, and follow social hype. | Extreme speculation is antithetical to both Halal and traditional investing frameworks. | No crypto integration. No leaderboards or gamified "streaks." |
| **The Institutional Quant (Eleanor)** | Wants API access to download raw financial data to run her own Python models. | Our value is the Compliance Framework Engine's output, not raw data reselling. | We do not provide CSV exports of raw market data. (Though we will eventually provide an API for the *results* of our engine). |

---

## 10. Feature-to-Persona Mapping Matrix

This matrix ensures that every major engineering undertaking directly serves a core persona need.

| Feature | Amir (Beginner) | Fatima (Analytical) | Sarah (ESG) | David (Student) |
|---|---|---|---|---|
| **Compliance Engine (Core)** | High Value (Safety) | High Value (Transparency) | High Value (Values) | Medium Value |
| **Paper Trading** | Critical (Risk-free practice) | Medium Value (Testing theories) | High Value (Simulation) | Critical (Classwork) |
| **Rule-by-Rule Explanations** | Critical (Learning) | High Value (Auditing) | High Value (Trust) | Critical (Connecting theory) |
| **Configurable Thresholds** | Low Value (Too complex) | Critical (Scholarly choice) | High Value (Custom ethics) | High Value (Experimentation) |
| **Framework Switching** | Low Value | Medium Value | High Value | Critical (Comparing philosophies) |
| **Purification Calculator** | High Value | Critical | N/A | N/A |
| **Clean, Modern UI** | High Value (Reduces anxiety) | Medium Value | High Value | High Value |

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Focus on Beginners vs. Experts** | Beginners & Intermediates (Amir/Fatima) | Institutional / Pro Traders | Pros demand features (Level 2 data, options) that distract from the core value proposition of compliance and education. |
| **Delayed Data vs. Real-Time** | Delayed (15-min) | Real-time streaming | Amir and Fatima are evaluating long-term compliance, not day trading. Delayed data saves massive infrastructure costs while serving the personas perfectly. |
| **Progressive Disclosure UI** | Simple by default, complex on click | High-density by default | Amir needs simplicity to avoid anxiety. Fatima needs depth for auditing. Progressive disclosure satisfies both without compromising the UI. |

---

## 12. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Persona Drift** | High | Medium | As the platform grows, there is a temptation to add active trading features (options, margin) to chase engagement, alienating Amir and Fatima. Mitigation: Strictly enforce the Anti-Persona guidelines during roadmap reviews. |
| **Complexity Overload** | High | High | Exposing configurable thresholds (for Fatima) might overwhelm Amir. Mitigation: Use sensible defaults based on widely accepted standards (e.g., AAOIFI). Hide advanced configurations behind an "Advanced Settings" toggle. |
| **Educational Ignorance** | Medium | Medium | Users might ignore the explanations and just look for the green checkmark. Mitigation: UI design must integrate the explanation into the primary visual hierarchy, not hide it behind an info icon. |

---

## 13. Future Expansion

| Persona Expansion | Phase | Description |
|---|---|---|
| **The Financial Educator** | Phase 4 | Professors or content creators who want to use HalalTrade to demonstrate concepts to their audience using custom frameworks. |
| **The Community Leader** | Phase 5 | Users who want to publish their custom frameworks for others to follow (e.g., "Sheikh Zaid's Strict Halal Framework"). |
| **The Institutional Compliance Officer** | Phase 5+ | B2B users who use the Compliance API to evaluate their fund's holdings automatically. |

---

## 14. Dependencies

| Dependency | Type | Impact on Personas |
|---|---|---|
| **UX/UI Design System** | Design | Crucial for Amir. If the UI is intimidating, Amir will abandon the platform. (`06-design-system.md`) |
| **Compliance Engine Explainability** | Engineering | Crucial for all personas. The engine must output structured text explanations, not just boolean values. (`14-compliance-engine.md`) |
| **Financial Data Quality** | Data | Crucial for Fatima. If the data is wrong, she will lose trust immediately. |

---

## 15. Engineering Notes

### 15.1 Architectural Implications of Personas
- **Amir's need for speed:** Amir expects modern app performance. The UI must feel instant (optimistic UI, caching) so he doesn't get frustrated.
- **Fatima's need for configurability:** The Compliance Framework Engine cannot hardcode thresholds. Rules must be parameterized so Fatima can pass in custom threshold overrides via her user settings profile.
- **David's need for multi-framework:** The database schema for portfolios must not be tightly coupled to "Halal." A portfolio is simply a collection of assets, which can be evaluated at runtime against *any* framework ID.

---

## 16. Recruiter Impact Notes

### 16.1 What This Document Demonstrates
- **Deep User Empathy:** Shows the ability to look past raw code and understand the psychological barriers users face (e.g., Amir's anxiety about Riba).
- **Strategic Focus:** Explicitly defining "Anti-Personas" demonstrates mature product thinking and the ability to say "no" to feature bloat.
- **Alignment:** Clearly connecting specific technical requirements (configurable thresholds) to validated user needs (Fatima's scholarly preferences) proves an understanding of product-driven engineering.

### 16.2 Talking Points
- "I didn't just build a screening engine; I built a system designed around the anxieties and needs of specific users. For example, the entire explainability architecture exists solely because users like 'Amir' are paralyzed by financial jargon."
- "By defining anti-personas like 'The Day Trader,' I was able to confidently make cost-saving engineering tradeoffs, like using 15-minute delayed data, without harming the core user experience."

---

## 17. Business Impact Notes

- **Lower Customer Acquisition Cost (CAC):** By hyper-targeting Amir and Fatima in the beachhead phase, marketing efforts can be highly specific (e.g., Reddit communities, Islamic finance YouTubers), resulting in cheaper and faster organic acquisition.
- **High Retention (Stickiness):** Fatima currently uses a spreadsheet because no tool allows her to configure her own thresholds. Once she sets up her custom framework on HalalTrade, her switching costs become very high.
- **Expansion Viability:** Sarah (ESG) proves that the TAM is not limited to Islamic finance. The same core technology serves a $40T ESG market with minimal code changes.

---

## 18. Document Cross-References

| Document | Relationship |
|---|---|
| `00-product-foundation.md` | Principles defined here (Explain Everything, Teach Through Usage) are direct responses to these personas. |
| `01-market-opportunity.md` | The demographics modeled in the market sizing are humanized here. |
| `04-user-journeys.md` | Maps exactly how Amir, Fatima, and Sarah move through the application step-by-step. |
| `14-compliance-engine.md` | Details the technical implementation of the features (explanations, configurability) required by these personas. |

---

> **End of Document**
>
> This document should be reviewed periodically. If user feedback indicates that our actual users differ significantly from Amir or Fatima, this document—and the subsequent product priorities—must be updated.
