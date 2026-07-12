# 04 — User Journeys

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Product & UX Design
> **Audience:** Engineering, Product, Design, QA, Recruiters
> **Depends On:** `00-product-foundation.md`, `03-user-personas.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Journey 1: Discovery & The First Trade (Amir — Beginner)](#5-journey-1-discovery--the-first-trade-amir--beginner)
6. [Journey 2: Framework Customization & Auditing (Fatima — Analytical)](#6-journey-2-framework-customization--auditing-fatima--analytical)
7. [Journey 3: Multi-Framework Exploration (Sarah — ESG)](#7-journey-3-multi-framework-exploration-sarah--esg)
8. [Journey 4: The Guest-to-User Conversion Funnel](#8-journey-4-the-guest-to-user-conversion-funnel)
9. [Key System Interactions & Edge Cases](#9-key-system-interactions--edge-cases)
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

This document translates the abstract needs of our User Personas (`03-user-personas.md`) into concrete, step-by-step product workflows. By detailing how users navigate through HalalTrade, we bridge the gap between UX design and engineering implementation. 

These journeys ensure that our core product principles—specifically *Explain Everything* and *Teach Through Usage*—are deeply embedded into the actual sequence of screens and API calls, rather than being treated as superficial marketing copy.

### 1.1 Who Should Read This

| Audience | What They Gain |
|---|---|
| **Designers** | Clear outlines for wireframing, prototyping, and identifying necessary UI states (e.g., loading, error, success). |
| **Frontend Engineers** | The exact sequence of state changes, data fetching requirements, and component routing. |
| **Backend Engineers** | Understanding of how API endpoints chain together to fulfill a user's intent. |
| **QA Engineers** | The foundation for end-to-end (E2E) testing scripts. |

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| UJ-1 | Map the end-to-end "Aha!" moment | Detail the fastest path for a user to experience a compliance explanation |
| UJ-2 | Document complex state changes | Clearly define what happens when a user modifies a framework |
| UJ-3 | Align UX with Engineering | Map every user step to its corresponding technical implication |
| UJ-4 | Design low-friction onboarding | Document the Guest-to-Registered funnel |

---

## 3. Scope

### 3.1 In Scope
- Core user flows for searching, evaluating, and trading stocks.
- Workflows for configuring and switching compliance frameworks.
- The onboarding and authentication funnel.
- Step-by-step breakdowns mapping user intent to UI actions and Backend API calls.

### 3.2 Out of Scope
- Edge-case error handling flows (e.g., forgotten password, 500 server errors).
- Admin dashboard workflows.
- Post-MVP features like social sharing or community framework publishing.

---

## 4. Executive Summary

The user journeys in HalalTrade are designed around a single architectural imperative: **The Compliance Framework Engine is the center of gravity.** 

Unlike traditional trading platforms where the "trade execution" is the climax of the journey, HalalTrade treats the "compliance evaluation" as the primary event. Trading is the vehicle; compliance education is the destination. 

We map three primary journeys:
1. **Amir's Journey** demonstrates how we teach a beginner through progressive disclosure.
2. **Fatima's Journey** demonstrates the power of parameterized frameworks and portfolio-level auditing.
3. **Sarah's Journey** demonstrates the platform's multi-framework extensibility.

---

## 5. Journey 1: Discovery & The First Trade (Amir — Beginner)

**Objective:** Get Amir from landing on the homepage to executing his first risk-free paper trade while teaching him exactly *why* the trade is compliant.
**Primary Principle Demonstrated:** Teach Through Usage & Explain Everything.

### Step-by-Step Flow

| Step | User Intent & Action | UI / Frontend Response | Backend / Technical Implication |
|---|---|---|---|
| **1. Search** | Amir arrives on the homepage and searches for "Apple" or "AAPL" in the global command palette (Cmd+K). | UI opens an autocomplete dropdown. As he types, it fetches results. | `GET /api/v1/search?q=AAPL` -> Returns cached basic asset info. |
| **2. View Asset** | Amir clicks on "Apple Inc. (AAPL)". | Navigates to `/assets/AAPL`. UI shows a skeleton loader while fetching data, prioritizing the Compliance Card. | Parallel fetches: `GET /api/v1/market-data/AAPL` (price/chart) & `GET /api/v1/compliance/evaluate?asset=AAPL&framework=halal-default`. |
| **3. The "Aha!" Moment** | Amir looks at the Compliance Card. It says "Compliant". He clicks the "Debt-to-Equity" rule row to expand it. | UI smoothly expands an accordion. It reveals the exact math: *Total Debt ($110B) / Total Equity ($350B) = 31%*. It includes a tooltip explaining why 33% is the Halal limit. | The Frontend renders the structured output from the Compliance Engine contract. No extra API call needed; the explanation is pre-calculated by the engine. |
| **4. Intent to Trade** | Reassured by the explanation, Amir clicks the primary CTA: "Buy AAPL (Paper Trade)". | UI detects Amir is unauthenticated. Opens a modal: "Sign in to place virtual trades and save your portfolio." | Frontend checks local Auth context (`useSession()`). |
| **5. Authentication** | Amir clicks "Continue with Google". | Redirects to Google OAuth flow, then back to the asset page. | `Auth.js` handles OAuth. Creates user in Postgres. Triggers initialization of a virtual portfolio with $100k balance. |
| **6. Order Entry** | Amir is returned to `/assets/AAPL`. The "Buy" modal is now open. He enters "$1,000". | UI validates he has sufficient virtual buying power. Estimates fractional shares. | Local validation against cached portfolio balance. |
| **7. Execution** | Amir clicks "Submit Order". | UI shows a subtle micro-animation (spinner -> success checkmark), then a toast: "Trade Executed. AAPL is currently 100% Halal Compliant." | `POST /api/v1/trading/orders` -> Validates order -> Re-runs compliance check (failsafe) -> Updates virtual balances -> Commits transaction. |
| **8. Portfolio View** | Amir clicks "Go to Portfolio". | Navigates to `/portfolio`. Shows his $1,000 in AAPL, his remaining cash, and a massive green badge: "Portfolio Compliance: 100%". | `GET /api/v1/portfolio/summary`. |

---

## 6. Journey 2: Framework Customization & Auditing (Fatima — Analytical)

**Objective:** Allow Fatima to customize the Shariah screening thresholds to match her specific scholarly preference and see the immediate retroactive impact on her portfolio.
**Primary Principle Demonstrated:** Framework Agnostic & Transparency Over Mystery.

### Step-by-Step Flow

| Step | User Intent & Action | UI / Frontend Response | Backend / Technical Implication |
|---|---|---|---|
| **1. Review Portfolio** | Fatima logs in and views her portfolio `/portfolio`. All 5 of her stocks currently show as "Compliant" under the Default Halal Framework. | Renders portfolio table. | `GET /api/v1/portfolio` includes a nested compliance evaluation for each holding based on her active framework. |
| **2. Intent to Modify** | Fatima wants a stricter Debt-to-Equity rule (30% instead of 33%). She clicks "Settings -> Active Framework". | Navigates to the Framework Configuration screen. Shows the Halal Framework with sliders/inputs for each rule threshold. | `GET /api/v1/users/me/framework-prefs` fetches her current overrides (if any). |
| **3. Configure Threshold** | Fatima changes the "Debt-to-Equity Limit" from 33% to 30%. She clicks "Save & Re-evaluate". | UI shows a loading state with text: "Re-evaluating your portfolio against new rules..." | `PUT /api/v1/users/me/framework-prefs`. The backend saves the new config, then immediately dispatches a background job to re-evaluate her portfolio. |
| **4. See The Impact** | Fatima is redirected back to her portfolio. The UI highlights that 1 stock (e.g., TSLA) has changed status from "Compliant" to "Non-Compliant". | UI uses a distinct warning color (e.g., amber/red) and places a notification dot on the changed asset. | The updated portfolio response now reflects the new rule threshold. |
| **5. Audit the Failure** | Fatima clicks on TSLA. She looks at the Compliance Card. | The card explicitly states: "Non-Compliant. Debt-to-Equity is 31%. This exceeds your custom threshold of 30%." | The Compliance Engine output dynamically references her custom configuration rather than the default framework rules. |
| **6. Take Action** | Fatima decides to sell TSLA to keep her portfolio perfectly aligned with her beliefs. She places a sell order. | Order executes. Portfolio compliance returns to 100%. | Standard trading execution flow, logging the sale. |

---

## 7. Journey 3: Multi-Framework Exploration (Sarah — ESG)

**Objective:** Show how a user can seamlessly switch between completely different investment philosophies to compare how a stock scores.
**Primary Principle Demonstrated:** Framework Agnostic.

### Step-by-Step Flow

| Step | User Intent & Action | UI / Frontend Response | Backend / Technical Implication |
|---|---|---|---|
| **1. Asset Discovery** | Sarah is looking at a major oil company (e.g., XOM). Her active framework is "Standard" (no filters). | The asset page loads. The Compliance Card says "Standard Framework: No Restrictions". | Evaluates against the null/standard framework plugin. |
| **2. Switch Framework** | Sarah clicks a dropdown on the Compliance Card: "Evaluate against...". She selects "ESG Framework". | UI shows a brief skeleton loader specifically on the Compliance Card (not the whole page). | `GET /api/v1/compliance/evaluate?asset=XOM&framework=esg-v1`. |
| **3. Review ESG Verdict** | The card updates. It shows "Non-Compliant (ESG)". | UI renders the new rule set: Environmental (Failed: High Carbon Intensity), Social (Passed), Governance (Passed). | The Frontend UI does not change its structure. It blindly renders the standardized output contract provided by the ESG plugin. |
| **4. Educational Deep Dive** | Sarah clicks the Environmental rule to understand the failure. | Expandable text explains: "The company's Scope 1 & 2 emissions exceed the ESG framework's tolerance for the Energy sector." | The ESG plugin provides different educational strings than the Halal plugin. |
| **5. Framework Comparison** | Curious, Sarah clicks "Compare Frameworks". A modal opens showing Halal vs. ESG side-by-side for XOM. | Modal shows XOM passes Halal (it's not alcohol/gambling and ratios are fine) but fails ESG (emissions). | Frontend fires parallel evaluation requests for both frameworks and renders the comparison. |

---

## 8. Journey 4: The Guest-to-User Conversion Funnel

**Objective:** Maximize user acquisition by providing immediate value before demanding registration, converting users exactly at the point of high intent.

1. **The Hook:** A user clicks a link from Reddit: *"Check out why AAPL is considered Halal"*.
2. **The Value (Unauthenticated):** They land on `/assets/AAPL`. They can see the full chart, the full compliance breakdown, and all educational explanations without creating an account.
3. **The Wall (Intent-Driven):** The user clicks "Buy (Paper Trade)" or "Add to Watchlist".
4. **The Pivot:** A modal intercepts: *"Save your research and practice trading with a $100k virtual portfolio. Sign in with Google."*
5. **The Payoff:** Post-OAuth, the user is returned *exactly* to where they were (the AAPL page with the Buy modal open), minimizing disruption.

---

## 9. Key System Interactions & Edge Cases

### 9.1 Missing Financial Data
- **Scenario:** A user searches for a micro-cap stock where fundamental data (e.g., Debt-to-Equity) is missing from our provider.
- **Journey Impact:** The Compliance Engine must not fail silently or guess.
- **UI Resolution:** The Compliance Card displays a distinct state: **"Insufficient Data"** (Gray).
- **Explanation:** *"We cannot confidently evaluate this stock because Q3 Total Debt data is currently unavailable. Practicing caution is advised."*

### 9.2 The "Edge of Compliance" Warning
- **Scenario:** A stock is technically compliant, but its debt is at 32.5% (dangerously close to the 33% threshold).
- **Journey Impact:** Add value by being proactive.
- **UI Resolution:** The rule passes, but renders with a "Warning" state (Yellow). 
- **Explanation:** *"Passed, but nearing limit. The debt ratio is 32.5%. If the company takes on more debt next quarter, it may become non-compliant."*

---

## 10. Tradeoffs

| Decision | Chosen | Alternative | Rationale |
|---|---|---|---|
| **Auth Wall Placement** | At the point of action (Trading/Saving) | At the front door (Must log in to search) | Generous guest access builds trust. Demonstrating the Compliance Engine's value *before* asking for an email dramatically increases conversion rates. |
| **Evaluation Timing** | On-the-fly (Runtime) | Pre-calculated daily batch jobs | Allowing Fatima to change thresholds requires runtime evaluation. We trade slightly higher API latency for infinite user configurability. |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Analysis Paralysis** | Medium | High | Amir might get overwhelmed by reading 5 different rules before making a trade. **Mitigation:** Use strict progressive disclosure. Show a simple Green/Red badge first. Hide the complex math in an accordion. |
| **Runtime Evaluation Latency** | High | Medium | Evaluating a 50-stock portfolio on-the-fly when Fatima logs in might take > 1 second. **Mitigation:** Implement aggressive Redis caching for standard frameworks; only evaluate on-the-fly for custom threshold overrides. |

---

## 12. Future Expansion

| Journey | Phase | Description |
|---|---|---|
| **The "Purification" Journey** | Phase 2 | Guiding the user through identifying dividend income that contains impermissible earnings, calculating the exact percentage, and providing links to donate it to charity. |
| **The Community Framework Journey** | Phase 5 | A user browses a "Framework Marketplace", finds a highly-rated ESG-Halal hybrid framework created by a community member, and applies it to their portfolio with one click. |

---

## 13. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Next.js Middleware / Auth.js** | Technical | Crucial for the seamless intercept and redirect in Journey 4 (Guest to User conversion). |
| **TanStack Query** | Technical | Required to handle the complex state of Background refetching in Journey 2 (Portfolio re-evaluation). |

---

## 14. Engineering Notes

- **Evaluation Output Contract:** These journeys rely heavily on the UI being "dumb" and the Backend being "smart". The UI should not contain `if (rule === 'debt-to-equity')`. The UI should map over an array of `rules` returned by the backend and render the provided `explanation` string and `status` enum.
- **Background Processing:** In Journey 2, when Fatima updates a framework, re-evaluating historical portfolio compliance can be heavy. The API must return a 202 Accepted and process the portfolio re-scoring asynchronously to avoid blocking the UI thread.

---

## 15. Recruiter Impact Notes

### 15.1 What This Document Demonstrates
- **Full-Stack Vision:** Translating user psychology (Amir's fear) into UI elements (Accordions) and finally into architectural requirements (Standardized JSON output contracts).
- **Edge Case Planning:** Anticipating how the system degrades gracefully when external data APIs fail (Section 9.1 - Insufficient Data).
- **Product-Led Growth (PLG):** The Guest-to-User conversion funnel demonstrates an understanding of how product design directly drives business acquisition metrics.

### 15.2 Talking Points
- "I designed the user journeys to ensure the backend architecture serves the UX. Because users need to customize thresholds, I knew we couldn't just pre-calculate compliance in a nightly cron job; we needed a performant, on-the-fly evaluation engine."
- "The UI is built to be completely framework-agnostic. Whether a user is evaluating a stock against Islamic law or Environmental impact, the React components are exactly the same—they just render the structured output of the engine."

---

## 16. Business Impact Notes

- **Conversion Rate Optimization:** By allowing users to experience the "Aha!" moment (the compliance explanation) *before* logging in, we expect a significantly higher visitor-to-registration conversion rate compared to platforms hidden behind auth walls.
- **Engagement/Session Length:** By embedding education within the asset page, we increase the average time-on-page and reduce bounce rates, as users don't have to leave the app to Google financial definitions.

---

## 17. Document Cross-References

| Document | Relationship |
|---|---|
| `03-user-personas.md` | Defines Amir, Fatima, and Sarah, whose motivations drive these journeys. |
| `05-information-architecture.md` | The journeys mapped here dictate the required page hierarchy and navigation paths. |
| `14-compliance-engine.md` | Provides the exact JSON data structures that the UI consumes in Step 3 of Journey 1. |
| `12-frontend-architecture.md` | Details the React/Next.js implementation (like TanStack query caching) required to make these journeys feel instantaneous. |

---

> **End of Document**
>
> This document should be updated whenever a new core feature (e.g., Purification Calculator, Custom Framework Builder) is introduced to ensure the workflow aligns with our product principles.
