# 08 — Component Library

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Frontend Engineering
> **Audience:** Frontend Engineers, UX Designers, QA
> **Depends On:** `06-design-system.md`, `07-page-inventory.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Architecture & Strategy (Shadcn UI + Atomic Design)](#5-architecture--strategy-shadcn-ui--atomic-design)
6. [Core Primitives (Atoms)](#6-core-primitives-atoms)
7. [Domain-Specific Composites (Molecules)](#7-domain-specific-composites-molecules)
8. [Complex Assemblies (Organisms)](#8-complex-assemblies-organisms)
9. [The Compliance Card (Deep Dive)](#9-the-compliance-card-deep-dive)
10. [State Management & Data Binding](#10-state-management--data-binding)
11. [Accessibility (a11y) Requirements](#11-accessibility-a11y-requirements)
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

This document catalogs the reusable building blocks of the HalalTrade frontend. While the Design System (`06-design-system.md`) establishes the visual rules (colors, spacing, typography), the Component Library translates those rules into executable React code. 

A financial application requires immense consistency. If a user sees a "Compliant" badge, it must look, feel, and behave identically whether it's on the Watchlist, the Portfolio, or the Asset Detail page. This library enforces that consistency while maximizing developer velocity.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| CL-1 | Enforce visual consistency | 100% of the UI is constructed from these defined components. No custom CSS or one-off HTML elements in page files. |
| CL-2 | Accelerate feature development | Engineers can build the Framework Configuration page in 1 day by composing existing sliders and cards. |
| CL-3 | Ensure framework-agnostic rendering | The `ComplianceCard` component must be able to render a Halal evaluation or an ESG evaluation without changing its internal React logic. |
| CL-4 | Mandate strict accessibility | All interactive primitives pass WCAG AA standards (keyboard navigation, ARIA roles, focus management). |

---

## 3. Scope

### 3.1 In Scope
- Identification of required Shadcn UI primitives.
- Specification of custom, domain-specific components (e.g., `OrderTicket`, `ComplianceCard`, `FinancialTable`).
- Component prop APIs and variant definitions.
- Guidelines for container vs. presentational components.

### 3.2 Out of Scope
- Exact pixel specifications (handled by Tailwind tokens in the Design System).
- Backend API implementation details.
- Storybook configuration or unit testing setups.

---

## 4. Executive Summary

The HalalTrade component library uses a modified Atomic Design methodology. At the base layer, we rely heavily on **Shadcn UI** (built on Radix UI) for unstyled, highly accessible primitives (Atoms). 

We combine these primitives to build highly specific financial composites (Molecules and Organisms) that are entirely unique to our domain. The most important of these is the `ComplianceCard`—a component designed specifically to consume the standardized output contract of the backend Compliance Framework Engine and render it beautifully, regardless of which framework generated the data.

---

## 5. Architecture & Strategy (Shadcn UI + Atomic Design)

### 5.1 The "Copy/Paste" Strategy
We do not install Shadcn UI as an npm package. We copy the source code of the primitives directly into our `components/ui/` directory. 
- **Why:** Full control. If we need to modify how the `Accordion` component handles focus for a dense financial table, we edit the source directly rather than fighting a third-party library API.

### 5.2 Folder Structure

```text
src/
 └── components/
      ├── ui/          # (Atoms) Pure Shadcn primitives (Button, Input, Badge)
      ├── shared/      # (Molecules) Generic composites (StatCard, DataGrid)
      └── domain/      # (Organisms) Business-specific (ComplianceCard, OrderTicket)
```

---

## 6. Core Primitives (Atoms)

These are the foundational elements located in `components/ui/`. They contain zero business logic.

| Component | Variant / Usage Notes | Shadcn Base |
|---|---|---|
| **Button** | `default` (Indigo), `destructive` (Rose), `outline` (Subtle border), `ghost` (Table actions). | `Button` |
| **Badge** | `success` (Emerald), `danger` (Rose), `warning` (Amber), `neutral` (Slate). Critical for compliance statuses. | `Badge` |
| **Input** | Standardized height and focus ring (Indigo). Used in order tickets and search. | `Input` |
| **Skeleton** | Matches the dark mode surface color (`#18181B`) with a subtle pulse. Used for loading states. | `Skeleton` |
| **Tooltip** | Instant appearance (0ms delay) on desktop. Essential for explaining financial jargon (e.g., P/E Ratio). | `Tooltip` |
| **Tabs** | Used on mobile to toggle between Chart and Compliance Card. | `Tabs` |

---

## 7. Domain-Specific Composites (Molecules)

These components live in `components/shared/`. They combine primitives but still don't know about specific backend API endpoints.

### 7.1 `StatCard`
- **Purpose:** Display a key financial metric (e.g., Portfolio Balance, Market Cap).
- **Props:** `title` (string), `value` (string/number), `trend` (positive/negative/neutral enum), `trendValue` (string).
- **Behavior:** Automatically formats numbers to currency/percentages based on context and colors the trend indicator (Green/Red).

### 7.2 `FinancialTable`
- **Purpose:** A highly optimized table for rendering dense numbers (Portfolio holdings, Watchlist).
- **Props:** `columns` (array of configs), `data` (array of objects), `onRowClick` (function).
- **Styling constraints:** Enforces `font-mono` on all numeric columns for vertical decimal alignment. Right-aligns numbers, left-aligns text.

### 7.3 `CommandPalette`
- **Purpose:** The global search and navigation engine (`Cmd+K`).
- **Props:** `isOpen`, `onClose`, `actions` (array of navigable routes or commands).
- **Behavior:** Intercepts global keyboard shortcuts. Implements fuzzy search over the provided data array.

---

## 8. Complex Assemblies (Organisms)

These components live in `components/domain/`. They handle complex state, forms, and business logic mapping.

### 8.1 `OrderTicket`
- **Purpose:** The interface for placing paper trades.
- **State Internal:** Validates input quantity against available buying power. Calculates estimated total (Qty * Current Price).
- **Props:** `assetTicker`, `currentPrice`, `buyingPower`, `onSubmit` (async function).
- **Visuals:** Uses a segmented control for "Buy / Sell", and an input for "Shares / Dollars" toggle. Disables submit button and shows inline error if buying power is exceeded.

### 8.2 `FrameworkConfigurator`
- **Purpose:** Renders the settings for adjusting a compliance framework's thresholds.
- **Props:** `frameworkSchema` (JSON defining the rules and min/max values), `currentValues` (user's overrides), `onSave`.
- **Behavior:** Dynamically generates `Slider` or `Switch` primitives based on the `frameworkSchema` provided by the backend. This ensures the frontend doesn't need to be redeployed if the backend adds a new rule to a framework.

---

## 9. The Compliance Card (Deep Dive)

The `ComplianceCard` is the most important React component in the application. It explicitly demonstrates the "Framework Agnostic" and "Explain Everything" product principles.

### 9.1 Component API
It accepts **one** prop: the standardized JSON output from the Compliance Framework Engine.

```typescript
interface ComplianceCardProps {
  evaluation: {
    frameworkName: string;
    verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'INSUFFICIENT_DATA';
    overallScore: number;
    rules: Array<{
      ruleName: string;
      passed: boolean;
      explanation: string;
      actualValue: string;
      threshold: string;
    }>;
  };
  isLoading?: boolean;
}
```

### 9.2 Rendering Logic (Framework Agnostic)
The component contains **no framework-specific logic**. It does not know what "Halal" or "ESG" means. 
- It renders the overall `verdict` as a massive colored Badge (Emerald/Rose) at the top.
- It iterates over the `rules` array, generating an `AccordionItem` for each.
- The visible part of the accordion shows `ruleName` and a green check or red X based on `passed`.
- Expanding the accordion reveals the human-readable `explanation`, merging the `actualValue` and `threshold` for complete transparency.

### 9.3 Progressive Disclosure Pattern
This component enforces the design system's progressive disclosure rule:
1. **Glance:** The top badge provides the immediate answer.
2. **Scan:** The collapsed accordion list provides the summary of what was checked.
3. **Study:** Expanding the accordion provides the deep educational context.

---

## 10. State Management & Data Binding

### 10.1 Container vs. Presentational Pattern
We strictly separate data fetching from UI rendering.
- **Domain/Organisms (e.g., `OrderTicket`)** are strictly presentational. They receive data via props and emit actions via callbacks (`onSubmit`). They do not fetch data.
- **Page Components (`app/(app)/assets/[ticker]/page.tsx`)** act as Containers. They use TanStack Query (`useQuery`, `useMutation`) to fetch data and pass it down to the Organisms.

### 10.2 Zustand for Global UI State
Zustand is used sparingly for purely client-side global UI state that doesn't belong in the URL or the server cache:
- `useCommandPaletteStore()`: Tracks whether the `Cmd+K` menu is open/closed.
- `useActiveFrameworkStore()`: Tracks which framework the user has currently selected in the UI dropdown (before saving it to the backend).

---

## 11. Accessibility (a11y) Requirements

Because financial tools require precision, accessibility is treated as a functional requirement, not a nice-to-have.

| Requirement | Implementation Rule |
|---|---|
| **Keyboard Navigation** | Every interactive element must be reachable via `Tab`. The `OrderTicket` must allow a user to submit a trade entirely via keyboard without touching a mouse. |
| **Focus Management** | When a modal (like the Command Palette) opens, focus is trapped inside it. When it closes, focus returns to the element that triggered it. (Handled automatically by Radix UI primitives). |
| **Color Contrast** | Red/Green compliance badges must be distinguishable by colorblind users. Every badge includes a clear icon (✅ / ❌) in addition to color. |
| **Screen Readers** | All complex tables (`FinancialTable`) must use proper `<th>` and `scope` attributes. Icon-only buttons must have `aria-label`s. |

---

## 12. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Styling Solution** | Tailwind + `cn()` utility | CSS Modules or Styled Components | Tailwind forces alignment to the design tokens. The `cn()` (clsx + tailwind-merge) utility allows us to safely pass custom classes to override components without CSS specificity nightmares. |
| **Primitive Strategy** | Copy/Paste (Shadcn) | Install via npm (MUI/Chakra) | Installing a heavy library brings unwanted visual baggage that makes the app look generic. Copy/pasting raw Radix UI wrappers allows us to achieve the exact "Linear/Vercel" premium aesthetic. |
| **Data Fetching in Components** | None (Props only) | SWR/React Query inside components | Keeping components dumb makes them infinitely reusable and dramatically easier to test via unit tests or Storybook. |

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Prop Drilling** | Medium | Passing compliance data from the Page down through 3 layers to the `ComplianceCard`. **Mitigation:** Use React Server Components (RSC) where appropriate, and compose UI cleverly using `children` props (Composition pattern) rather than endless prop drilling. |
| **Chart Re-rendering** | High | TradingView Lightweight Charts is imperative and heavy. If React re-renders it on every keystroke in the order ticket, performance will crash. **Mitigation:** Wrap the chart in `React.memo` and strictly isolate state changes in sibling components. |
| **Inconsistent Number Formatting** | High | Showing $1,000.0 on one screen and $1k on another destroys trust. **Mitigation:** Create a strict `formatCurrency()` and `formatPercentage()` utility layer. Components must never format numbers natively; they must use the utility. |

---

## 14. Future Expansion

| Component Needs | Phase | Description |
|---|---|---|
| **Draggable Layout Widgets** | Phase 4 | Allowing users to customize their dashboard by dragging `StatCard` or `ComplianceCard` components into a grid layout. |
| **Advanced Chart Annotations** | Phase 4 | Wrapping the TradingView drawing API in React components to allow technical analysis on the chart. |

---

## 15. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Radix UI Primitives** | Frontend | The underlying unstyled logic engines for Modals, Accordions, and Tabs used by Shadcn. |
| **Lucide React** | Design | The chosen icon set. Must be imported consistently across all components (e.g., `<CheckCircle />`, `<AlertTriangle />`). |

---

## 16. Engineering Notes

- **The `cn` utility:**
  ```typescript
  import { clsx, type ClassValue } from "clsx"
  import { twMerge } from "tailwind-merge"
  
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```
  This is the most critical utility in the library. It allows us to safely do: `<Button className={cn("base-classes", props.className)} />`.

- **Client Components vs Server Components:** Shadcn UI components that use interactivity (like `onClick` or `useState`) must include the `"use client"` directive at the very top of the file. Pure layout components should remain Server Components for performance.

---

## 17. Recruiter Impact Notes

### 17.1 What This Document Demonstrates
- **Modern React Architecture:** Demonstrates deep knowledge of the current React ecosystem (Shadcn UI, Radix, Server/Client component mental models, Tailwind-merge).
- **Domain-Driven Design (Frontend):** Showing how generic UI primitives are assembled into strictly defined domain entities (like the `ComplianceCard` consuming a standardized contract).
- **Performance & Scalability Awareness:** Identifying the re-render risk with heavy third-party imperative libraries (TradingView) and mitigating it with React memoization strategies.

---

## 18. Business Impact Notes

- **Velocity via Reusability:** Once this library is established (usually taking 1-2 weeks of upfront engineering), the time required to build new pages drops exponentially. A new ESG framework feature doesn't require a new UI design—the existing `ComplianceCard` just receives different JSON data.
- **Brand Trust:** Enforcing the `formatCurrency()` utility and monospace numbering across all components ensures the platform looks like a serious institutional tool, building the trust necessary for user retention.

---

## 19. Document Cross-References

| Document | Relationship |
|---|---|
| `06-design-system.md` | The visual rules that dictate the styling applied to these components. |
| `07-page-inventory.md` | Defines the pages where these assemblies and organisms will be placed. |
| `14-compliance-engine.md` | Defines the exact JSON structure that the `ComplianceCard` component must be built to parse and render. |

---

> **End of Document**
>
> All new generic components must be added to the `components/shared/` or `components/ui/` index. Domain-specific components should be fiercely protected against feature creep.
