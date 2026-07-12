# 24 — Project Naming & Brand Strategy

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-07-02
> **Owner:** Product Marketing & Founders
> **Audience:** Marketing, Design, Stakeholders
> **Depends On:** `00-product-foundation.md`, `03-user-personas.md`, `20-future-roadmap.md`

*(Note: Filename was corrected from `project_naming` to `project-naming` to maintain alignment with the Master Context).*

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [The Working Title (HalalTrade)](#5-the-working-title-halaltrade)
6. [Core Naming Principles](#6-core-naming-principles)
7. [Brand Voice & Tone](#7-brand-voice--tone)
8. [The "Phase 4 Expansion" Naming Dilemma](#8-the-phase-4-expansion-naming-dilemma)
9. [Naming Explorations & Categories](#9-naming-explorations--categories)
10. [Legal & Technical Considerations](#10-legal--technical-considerations)
11. [Tradeoffs](#11-tradeoffs)
12. [Risks](#12-risks)
13. [Engineering Notes](#13-engineering-notes)
14. [Business Impact Notes](#14-business-impact-notes)
15. [Document Cross-References](#15-document-cross-references)

---

## 1. Purpose

This document outlines the brand identity and naming strategy for the platform. Currently operating under the placeholder name **"HalalTrade"**, the project requires a permanent brand identity before the public MVP launch. A fintech brand name must instantly convey trust, institutional rigor, and modern technology.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| PN-1 | Establish Trust | The name must sound like a regulated financial institution, not a crypto casino. |
| PN-2 | Accommodate Growth | The name should not strictly trap the product in the "Islamic Finance only" category, allowing for Phase 4 ESG expansion. |
| PN-3 | Define the Voice | Establish the copywriting tone to be used across the UI, marketing, and legal compliance copy. |

---

## 3. Scope

### 3.1 In Scope
- Evaluation of the current working title.
- Core brand principles and tone of voice.
- Exploratory name categories and examples.
- The tension between the MVP focus (Halal) and the long-term vision (Multi-Framework).

### 3.2 Out of Scope
- Final logo design or specific typography choices (Covered in `06-design-system.md`).
- Marketing campaign taglines.

---

## 4. Executive Summary

Choosing a name for this platform requires navigating a deliberate tension: **Phase 1-3** is exclusively focused on the Islamic Finance market, while **Phase 4+** expands into ESG and custom frameworks. 

If the name is too overtly Islamic (e.g., "DeenInvest"), expanding to the ESG market in Year 2 becomes impossible without a massive rebrand. If the name is too generic (e.g., "EthicTrade"), it may fail to capture the intense loyalty of the initial core Muslim demographic who are desperately seeking a Halal-first solution.

The strategy recommends an **Abstract or Evocative** name that sounds institutional and trustworthy, leaning heavily on the brand's *visuals and copywriting* to speak to the specific Halal audience during the MVP phase.

---

## 5. The Working Title (HalalTrade)

**Why it worked for internal development:**
- It is perfectly descriptive. Every engineer and stakeholder instantly knows what the product does.

**Why it must be replaced for launch:**
- It is unimaginative and highly generic, making trademarking difficult.
- It completely breaks the Phase 4 roadmap. An ESG investor looking for carbon-neutral portfolios will not sign up for an app called "HalalTrade."

---

## 6. Core Naming Principles

Any proposed final name must pass these three filters:

1. **The Institutional Filter:** Does it sound like a company that should hold $10,000 of your real money? (Rules out overly playful Web3 names like "CoinDoge").
2. **The Precision Filter:** Does it evoke concepts of accuracy, clarity, filtering, or auditing? The core IP is the Compliance Engine's mathematical precision.
3. **The Global Filter:** Is it easy to pronounce and spell across multiple geographies (US, UK, MENA, Southeast Asia)?

---

## 7. Brand Voice & Tone

The tone of the copywriting inside the app (from the Compliance Explanations to the Error Toasts) defines the brand just as much as the name.

### 7.1 Voice Attributes
- **Educational, not Preachy:** The platform *explains* the math (e.g., "Debt is 31%"). It does not pass moral judgment on the user's choices.
- **Empowering, not Restrictive:** Traditional Halal finance often feels like a list of "No's." Our brand voice focuses on the "Yes"—empowering users to invest confidently.
- **Institutional Clarity:** We use precise financial terminology (Cost Basis, Trailing 12-Month Market Cap) but provide clear, jargon-free tooltips for beginners.

---

## 8. The "Phase 4 Expansion" Naming Dilemma

### Strategy A: Niche First, Rebrand Later
Name the company something explicitly Muslim (e.g., "UmmahInvest") to maximize Day 1 traction. When Phase 4 arrives, spend $1M+ to rebrand to a generic name.
- **Pros:** Instant product-market fit. High viral loop in the target community.
- **Cons:** Rebrands are incredibly expensive, cause massive SEO loss, and confuse existing users.

### Strategy B: Broad Name, Niche Marketing (Recommended)
Choose a brand name that signifies "Ethical Precision" or "Clear Filtering" (e.g., "Lucid", "Prism", "Axiom"). Use the marketing copy and the default app state to aggressively target the Halal market. 
- **Pros:** Zero friction when adding ESG later. The core platform name stays the same, we just launch a new "ESG Framework" product line.
- **Cons:** Requires the marketing and UI copy to work slightly harder to convince the Day 1 Muslim user that the platform was built *specifically* for them.

---

## 9. Naming Explorations & Categories

### Category 1: The "Clarity & Precision" Abstract Names
Focuses on the engine's ability to "see clearly" into a company's balance sheet.
- **Concepts:** Prism, Lucid, Optic, Visi, Clear.
- **Examples:** PrismFi, LucidTrade, ClearCap.
- **Why it works:** Sounds like a modern fintech data company. Transitions perfectly to ESG.

### Category 2: The "Guiding Principle" Names
Focuses on ethics, alignment, and doing the right thing.
- **Concepts:** True, North, Align, Ethos, Axiom.
- **Examples:** Axiom Wealth, AlignInvest, TrueMarket.
- **Why it works:** Captures the emotional resonance of value-based investing without alienating any specific religion or philosophy.

### Category 3: Subtle Arabic/Islamic Roots
Using Arabic words that relate to truth, clarity, or growth, but are abstract enough not to alienate non-Muslims in Phase 4.
- **Concepts:** Safi (Pure), Yaqeen (Certainty), Bayaan (Clear Explanation).
- **Examples:** SafiTrade, Bayaan Capital.
- **Why it works:** A "dog whistle" to the target MVP demographic that creates instant loyalty, but sounds like an abstract startup name to the broader ESG market.

---

## 10. Legal & Technical Considerations

Before finalizing a name, it must clear these technical hurdles:

1. **Domain Availability:** Must secure a `.com` or a high-tier `.io` / `.finance`. `app.brandname.com` is acceptable if the root `.com` is parked, but avoid weird spellings (e.g., `Axyyom.com`).
2. **Trademark Search:** Must clear the USPTO (US Patent and Trademark Office) database specifically under Class 36 (Financial Services) and Class 42 (Software as a Service).
3. **App Store Conflicts:** A generic name like "ClearTrade" might already have 50 identical search results in the iOS App Store. The name must be distinct enough to rank #1 for its own brand term.

---

## 11. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Naming Focus** | Abstract/Evocative | Explicitly Halal | An explicitly Halal name maximizes early adoption but completely breaks the Phase 4 ESG TAM expansion. Abstract naming allows the company to scale infinitely. |
| **Domain Strategy** | Add a suffix (`[Brand]Finance.com`) | Pay $50k+ for the exact `.com` | Pre-revenue startups should not burn runway on premium domains. A suffix domain (e.g., `try[Brand].com`) is perfectly acceptable for the MVP phase. |

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **"Bland" Brand Syndrome** | High | If the name is too abstract (e.g., "OmniTrade"), users feel no emotional connection, and acquisition costs skyrocket. **Mitigation:** The UI design (`06-design-system.md`) must be visually stunning and deeply opinionated to compensate for an abstract name. |
| **Trademark Infringement** | High | Receiving a Cease & Desist letter 1 week before the Phase 3 (Real Money) launch. **Mitigation:** Engage a trademark attorney immediately after selecting the top 3 candidates. Do not write the chosen name into the codebase until the trademark application is filed. |

---

## 13. Engineering Notes

- **The `NEXT_PUBLIC_APP_NAME` Variable:** Engineers must NEVER hardcode the string "HalalTrade" into the React UI or the NestJS email templates. The app name must be drawn from an environment variable or a central `constants.ts` file to allow for an instant, 1-line find-and-replace when the final name is chosen.
- **Asset Paths:** Avoid using "halaltrade" in database schema names, S3 bucket names, or internal package scopes (`@halaltrade/core`). Use a generic project codename (e.g., `project-alpha`) for infrastructure naming to prevent painful terraform migrations later.

---

## 14. Business Impact Notes

- **The B2B Pivot:** When Phase 5 arrives and the company pitches its API to traditional institutional banks, an abstract, technology-focused name (e.g., "Prism Data") will close enterprise deals significantly faster than a consumer-focused niche name.
- **Investor Optics:** Venture Capitalists fund TAM (Total Addressable Market). Pitching a company named "MuslimInvest" signals a $3.6T niche. Pitching "Axiom Data" signals a $40T global compliance infrastructure play.

---

## 15. Document Cross-References

| Document | Relationship |
|---|---|
| `20-future-roadmap.md` | The naming strategy is entirely dictated by the multi-phase expansion defined here. |
| `06-design-system.md` | The visual identity must match the tone and name selected in this process. |
| `00-product-foundation.md` | The name must reflect the core principle of "Explain Everything". |

---

> **End of Document**
>
> The final brand name will be decided by the founders before Sprint 5. Until then, use "Project Alpha" or "The Platform" in all internal code and documentation to prevent hardcoding a temporary name.
