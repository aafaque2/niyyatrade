# 06 — Design System

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** UX Design & Frontend Engineering
> **Audience:** Design, Engineering, Product, QA
> **Depends On:** `00-product-foundation.md`, `05-information-architecture.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Design Philosophy & Influences](#5-design-philosophy--influences)
6. [Color System & Semantic Tokens](#6-color-system--semantic-tokens)
7. [Typography System](#7-typography-system)
8. [Spacing & Grid System](#8-spacing--grid-system)
9. [Motion & Interaction Guidelines](#9-motion--interaction-guidelines)
10. [Data Visualization & Charting](#10-data-visualization--charting)
11. [Component Primitives (Shadcn UI Strategy)](#11-component-primitives-shadcn-ui-strategy)
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

This document defines the visual and interactive language of HalalTrade (working name). It serves as the single source of truth for UI design decisions, establishing the constraints that ensure the product feels "Premium, Fast, and Trustworthy." 

A financial application lives or dies on its interface. If the UI looks like a student project or a generic SaaS template, users will not trust it with their portfolio tracking or compliance evaluations. This document enforces the standards necessary to achieve institutional-grade aesthetic quality.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| DS-1 | Establish a premium visual identity | Avoid all signals of "cheapness" (inconsistent padding, poor contrast, generic colors). |
| DS-2 | Standardize Tailwind usage | Define the exact Tailwind utility constraints to prevent CSS bloat and "magic numbers". |
| DS-3 | Optimize for data density | Ensure the system can display complex financial matrices without feeling cluttered. |
| DS-4 | Define the Dark Mode standard | Ensure Dark Mode is treated as the default, first-class experience, not an afterthought. |

---

## 3. Scope

### 3.1 In Scope
- Core design tokens (Color, Typography, Spacing).
- Motion and micro-interaction constraints.
- Strategy for integrating and theming Shadcn UI.
- Guidelines for financial data visualization (Charts, Tables, Badges).
- Dark Mode implementation strategy.

### 3.2 Out of Scope
- Detailed specifications for every individual component (Covered in `08-component-library.md`).
- Brand identity, logo design, and marketing assets (Covered in `24-project-naming.md`).
- Information Architecture (Covered in `05-information-architecture.md`).

---

## 4. Executive Summary

The HalalTrade Design System is built to project **Trust through Clarity**. 

It borrows the information density of TradingView, the precise typography of Linear, and the approachability of modern consumer fintechs (like Robinhood), while explicitly rejecting gimmicky animations and template-based aesthetics. 

Technically, the system is implemented via **Tailwind CSS** using a strict subset of utility classes, layered over **Shadcn UI** for accessible component primitives. Dark Mode is the default operating environment, utilizing a deeply crafted slate/zinc palette to reduce eye strain during prolonged financial analysis.

---

## 5. Design Philosophy & Influences

### 5.1 The "Feel" Requirements
As mandated by the Product Foundation (`00-product-foundation.md`), the UI must feel:
- **Professional & Premium:** Exacting attention to border radii, subtle borders, and harmonious shadow elevation.
- **Intentional:** No decorative elements. If a gradient or a shadow exists, it must serve a structural or hierarchical purpose.
- **Fast:** Perceived speed is driven by UI constraints. Transitions must be rapid (150ms-200ms).

### 5.2 What We Are Avoiding
- **The "AI Generated" Look:** Avoid overly saturated, mismatched neon colors and floating elements that lack grounding.
- **The "Generic SaaS" Look:** Avoid the standard white background, blue primary button, and rounded-xl cards everywhere. 
- **The "Boring Bank" Look:** Avoid looking like legacy banking software (dense gray boxes, tiny fonts, zero visual hierarchy).

### 5.3 Core Influences
- **TradingView:** For how to handle massive amounts of numbers without looking messy.
- **Linear:** For keyboard-first interactions, subtle borders, and precise dark mode execution.
- **Vercel / Stripe:** For data tables, status badges, and developer-grade polish.

---

## 6. Color System & Semantic Tokens

### 6.1 The Dark Mode Default
HalalTrade is designed **Dark-Mode First**. Financial applications are often stared at for hours; dark mode reduces eye strain and makes bright compliance indicators (Red/Green) pop effectively.

### 6.2 Base Palette (Zinc / Slate)
We utilize customized, desaturated grays with a very subtle blue/purple undertone for depth, avoiding pure blacks (`#000000`) and pure grays which feel lifeless.

- `background`: `#09090B` (Extremely dark zinc, almost black but grounded).
- `surface`: `#18181B` (For cards and elevated containers).
- `surface-hover`: `#27272A` (For interactive list items).
- `border`: `#27272A` (Subtle 1px borders to define structure).

### 6.3 Semantic Colors (The Compliance Palette)
In a compliance engine, color is data. Red, Green, and Yellow carry strict meanings and must *never* be used for decorative purposes.

| Role | Color Value (Dark) | Tailwind Variable | Usage |
|---|---|---|---|
| **Compliant / Success** | Emerald 500 (`#10b981`) | `bg-success`, `text-success` | Framework Passes, Positive Return (PnL) |
| **Non-Compliant / Danger** | Rose 500 (`#f43f5e`) | `bg-danger`, `text-danger` | Framework Fails, Negative Return, Destructive Actions |
| **Warning / Near Limit** | Amber 500 (`#f59e0b`) | `bg-warning`, `text-warning` | Warning state, Nearing a debt threshold |
| **Insufficient Data** | Slate 400 (`#94a3b8`) | `bg-muted`, `text-muted-foreground` | Missing financial data, null states |
| **Primary Action** | Indigo 500 (`#6366f1`) | `bg-primary` | Main Call-to-Action (e.g., "Submit Order") |

### 6.4 The "Dimming" Rule
To keep the UI premium, semantic colors in large areas (like background banners) must use highly transparent, dimmed versions of the base color (e.g., 10% opacity Emerald for a compliant banner background) rather than solid fills, to avoid overwhelming the user's eyes.

---

## 7. Typography System

Financial UIs require numbers to align perfectly and text to be highly legible at small sizes.

### 7.1 Font Families
- **Sans-Serif (Primary):** `Inter` or `Geist`. Chosen for exceptional legibility at small sizes and a modern, technical aesthetic.
- **Monospace (Data):** `JetBrains Mono` or `Geist Mono`. **Critical Requirement:** All dynamic financial data (prices, ratios, PnL) MUST be rendered in tabular numerals or a monospace font to ensure decimal points align vertically in tables.

### 7.2 Type Scale Constraints
To prevent inconsistency, we strictly limit text sizes.
- `text-xs` (12px): Utility text, timestamps, table headers.
- `text-sm` (14px): Primary body text, table data, UI controls. (Default size for max density).
- `text-base` (16px): Input fields, primary buttons.
- `text-lg` (18px): Card headers, section titles.
- `text-2xl` (24px): Page headers, major portfolio balances.

### 7.3 Font Weights
- `Regular (400)`: Body text.
- `Medium (500)`: UI components, Buttons, Table Headers (Avoids the 'heavy' look of bold, maintains a premium feel).
- `Semibold (600)`: Emphasized data points, major headers.

---

## 8. Spacing & Grid System

### 8.1 The 4pt Grid
All margins, paddings, and heights must adhere to a strict 4-point multiple grid.
- `p-1` (4px), `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- **Absolute Ban:** No "magic numbers" (e.g., 13px, 21px). If a design needs spacing, it uses a Tailwind token.

### 8.2 Container Constraints
- Cards and containers should use subtle inner padding (`p-4` or `p-6`).
- Border Radius is strictly controlled to maintain a serious, professional look. We use `rounded-md` (6px) or `rounded-lg` (8px). **Banned:** `rounded-2xl` or pill-shaped containers (except for small status badges), which make the app look like a toy.

---

## 9. Motion & Interaction Guidelines

Motion must follow the "Subtle, Purposeful, Fast" principle.

### 9.1 Timing & Easing
- **Micro-interactions (Hover, Focus, Click):** `150ms ease-in-out`.
- **Layout Transitions (Modals, Accordions):** `200ms ease-out`. (Snappy entry, smooth finish).
- **Prohibited:** Any animation lasting longer than `300ms`. Bounce effects. Heavy parallax.

### 9.2 Focus States
Keyboard navigation is a priority (Linear influence). Every interactive element MUST have a highly visible focus state.
- **Focus Ring:** `ring-2 ring-primary ring-offset-2 ring-offset-background`.

### 9.3 Skeleton Loaders
Never use spinners for primary page content. Use subtle, pulsing skeleton shapes that exactly match the dimensions of the loading content to prevent layout shift.

---

## 10. Data Visualization & Charting

### 10.1 Chart Engine
- **Library:** TradingView Lightweight Charts.
- **Theming:** Must be strictly themed to match our Dark Mode background (`#09090B`) with subtle grid lines (`#27272A`).
- **Candlesticks:** Bullish (Emerald), Bearish (Rose).

### 10.2 The Compliance Evaluation Table
This is the heart of the product. It must be scannable.
- **Row Structure:** 
  - Left: Status Icon (✅/❌).
  - Middle: Rule Name (e.g., "Debt-to-Equity").
  - Right: Actual Value vs. Threshold (e.g., "31% < 33%").
- **Accordion:** Clicking the row expands to show the human-readable explanation paragraph in a slightly dimmed text (`text-muted-foreground`) to establish visual hierarchy.

---

## 11. Component Primitives (Shadcn UI Strategy)

We use **Shadcn UI** not as a component library to install, but as a set of accessible, unstyled primitives (built on Radix UI) that we copy into our codebase and theme completely.

### 11.1 Key Modifications to Shadcn Defaults
- **Borders:** Reduce border contrast on cards/inputs to `#27272A` (subtler than default).
- **Buttons:** Remove heavy drop-shadows on primary buttons. Use solid fills with a slight brightness increase on hover.
- **Inputs:** Ensure background is slightly lighter than the page background (`bg-zinc-900`) to create inset depth.

---

## 12. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **CSS Framework** | Tailwind CSS | CSS-in-JS (Styled Components) | Tailwind enforces token constraints by default, preventing developers from adding arbitrary colors/spacing. It also results in zero runtime overhead. |
| **Component Library** | Shadcn UI (Copy/Paste) | MUI or Chakra UI (npm package) | Total control over the DOM and styling. Heavy pre-built libraries make it impossible to achieve the specific "Linear-like" premium aesthetic. |
| **Typography Focus** | Monospace numbers | Standard Sans-Serif | Financial tables where decimals don't align look instantly amateur. Monospace numerals are a non-negotiable tradeoff for aesthetics vs. functionality. |

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Design Fragmentation** | High | Over time, developers introduce custom hex codes instead of using semantic tokens. **Mitigation:** Enforce strict ESLint rules blocking arbitrary Tailwind values (e.g., `bg-[#123456]`). |
| **Accessibility Failure** | High | Dark mode low-contrast designs often fail WCAG guidelines. **Mitigation:** Ensure all text-to-background contrast ratios for primary info meet WCAG AA (4.5:1). "Muted" text must still be readable. |
| **Chart Customization Limits** | Medium | TradingView Lightweight Charts has theming constraints. **Mitigation:** Verify early that the chart background and gridlines can perfectly match our Tailwind tokens to prevent an ugly "box" effect. |

---

## 14. Future Expansion

| Feature | Design System Impact | Phase |
|---|---|---|
| **Light Mode** | Requires a complete inversion of the color token map. Must ensure Light mode doesn't feel "blinding" compared to the refined Dark mode. | Phase 3 |
| **Mobile App (React Native)** | Tailwind tokens must be translated into React Native StyleSheet objects or NativeWind configurations. | Phase 4 |
| **Custom Framework Theming** | If users can create custom frameworks, they may need to pick identifying colors for them. Requires adding a dynamic, user-selected color palette to the strict system. | Phase 5 |

---

## 15. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Tailwind CSS configuration** | Technical | Must be set up perfectly in `tailwind.config.ts` before any component development begins. |
| **TradingView Lightweight Charts** | External | Chart theming API must be abstracted into a React component that automatically consumes our Tailwind config. |

---

## 16. Engineering Notes

- **The `cn()` utility:** Use `clsx` and `tailwind-merge` universally via a `cn()` helper function to allow component props to safely override internal Tailwind classes without specificity conflicts.
- **CSS Variables:** Map Tailwind colors to CSS variables in `globals.css` (e.g., `--background: 240 10% 3.9%;`) to allow for seamless theme switching if Light Mode is ever introduced.

---

## 17. Recruiter Impact Notes

### 17.1 What This Document Demonstrates
- **Design-Engineering Bridge:** Demonstrates an understanding of how design tokens translate into code constraints (Tailwind configs, ESLint rules).
- **Product Aesthetics Awareness:** Shows that you don't just build functional code; you understand the psychology of UI. By explicitly banning "magic numbers" and enforcing tabular numerals for financial data, it proves senior-level frontend maturity.
- **Accessibility & UX Focus:** Mandating keyboard focus rings, WCAG contrast checks, and banning layout-shifting spinners in favor of skeleton loaders highlights a commitment to user experience.

---

## 18. Business Impact Notes

- **Building Trust:** In Fintech, aesthetic quality correlates directly with user trust. If the product looks highly polished and professional, users will trust its compliance evaluations. A sloppy UI undermines the authority of the Compliance Framework Engine.
- **Development Velocity:** By locking down the design system early and using Shadcn UI primitives, the team spends zero time arguing about button padding or hex codes, allowing rapid feature iteration in later phases.

---

## 19. Document Cross-References

| Document | Relationship |
|---|---|
| `00-product-foundation.md` | Provides the guiding principles (Premium, Professional, Fast) that this system enforces. |
| `05-information-architecture.md` | Dictates the layout structures (Sidebars, Command Palettes) that these design tokens will skin. |
| `08-component-library.md` | The direct consumer of this document. It takes these rules and builds the actual React components. |
| `12-frontend-architecture.md` | Details how Tailwind and Shadcn will be integrated into the Next.js build pipeline. |

---

> **End of Document**
>
> The design system is a constraint engine. If a new design requires breaking these constraints, the design must be challenged before the system is updated.
