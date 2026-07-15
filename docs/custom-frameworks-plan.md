# Custom Frameworks — Implementation Plan

## Overview

Allow users to create, customise, and manage their own compliance frameworks alongside the built-in Standard, ESG, and Halal (AAOIFI) frameworks. Custom frameworks let users define which compliance rules to apply and set their own thresholds.

## Goals

- Let users define frameworks by selecting which rules to include
- Allow threshold customisation for financial ratio rules
- Store custom frameworks per-user (client-side MVP, backend migration later)
- Custom frameworks work identically to built-in ones for compliance evaluation
- Provide a creation, editing, and deletion flow

---

## Data Model

### Custom Framework (Frontend)

```ts
interface CustomFramework {
  id: string;                // UUID generated on creation
  slug: string;              // "custom-{uuid}" for routing
  name: string;              // User-provided display name
  description: string;       // User-provided description
  rules: RuleDefinition[];   // Selected rules
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}

interface RuleDefinition {
  ruleId: string;            // Unique identifier for the rule
  type: "percentage" | "sector" | "esg_sector";
  name: string;              // Display name (e.g., "Debt Threshold")
  description: string;       // Explanation of what this rule does
  enabled: boolean;          // Whether this rule is active
  threshold?: number;        // For percentage rules
  bannedSectors?: string[];  // For sector rules
}
```

### Available Rule Templates

These are the rule types users can choose from when building a custom framework:

| Rule ID | Type | Default Threshold | Description |
|---------|------|-------------------|-------------|
| `debt_to_equity` | percentage | 33.33% | Maximum debt-to-market-cap ratio |
| `interest_income` | percentage | 5% | Maximum interest income as % of revenue |
| `sector_screen` | sector | — | Ban specific industry sectors |
| `esg_carbon` | esg_sector | — | Screen high-carbon sectors |
| `esg_weapons` | esg_sector | — | Screen weapons/defense companies |
| `esg_tobacco_alcohol` | esg_sector | — | Screen tobacco and alcohol producers |
| `esg_employee` | esg_insufficient_data | — | Employee satisfaction data check |
| `esg_conduct` | esg_insufficient_data | — | Ethical conduct data check |

---

## UI Components

### 1. "+" Create Card

Positioned at the end of the framework grid on the Compliance Center page.

- Dashed border, muted appearance
- Shows a `+` icon and "Create Custom Framework" label
- On hover: subtle highlight
- Click: opens the create modal

### 2. Create/Edit Modal

A modal dialog with a step-by-step or single-page form:

**Step 1 — Name & Description**
- Framework name (required, max 50 characters)
- Description (optional, max 200 characters)

**Step 2 — Select Rules**
- Checkboxes for each available rule type
- Each checkbox shows the rule name, description, and default value
- When enabled, threshold controls appear (slider or number input)

**Step 3 — Preview & Save**
- Summary of selected rules
- "Save Framework" button

### 3. Custom Framework Card

Built-in frameworks show a badge. Custom frameworks show:
- "Custom" badge (e.g., muted/blue color)
- Hover state reveals a delete icon (trash) in the top-right corner
- Click: opens framework detail view (same as built-in)

### 4. Framework Detail for Custom

Same layout as built-in framework detail, but:
- Description is user-provided (or a default "Custom compliance framework")
- Rules are rendered from the saved `RuleDefinition[]`
- Threshold sliders are editable
- "Save Changes" persists to localStorage
- "Delete Framework" button in the footer

---

## Storage

### localStorage Key

```
niyyatrade:custom-frameworks
```

### Shape

```json
{
  "frameworks": [
    {
      "id": "a1b2c3d4-...",
      "slug": "custom-a1b2c3d4",
      "name": "My Custom Framework",
      "description": "...",
      "rules": [...],
      "createdAt": "2026-07-15T...",
      "updatedAt": "2026-07-15T..."
    }
  ]
}
```

### CRUD Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| List all | `getCustomFrameworks()` | Read from localStorage, parse, return |
| Create | `createCustomFramework(data)` | Generate ID/slug, append, save |
| Update | `updateCustomFramework(id, data)` | Find by ID, merge, save |
| Delete | `deleteCustomFramework(id)` | Filter out by ID, save |

---

## Integration Points

### Framework Selection (Top Nav Toggle)

Custom frameworks appear in the toggle pill after the built-in ones. If more than 4 total frameworks, the toggle may need a dropdown or scroll mechanism.

### Compliance Evaluation

When a custom framework is active, the compliance engine must evaluate using only the user-selected rules:

1. Fetch custom framework from localStorage
2. Map `RuleDefinition[]` to `RuleSpec[]` format
3. Pass to the compliance evaluation endpoint
4. Display results identically to built-in frameworks

**Backend consideration:** The compliance engine (`/compliance/evaluate`) accepts rule specs. For custom frameworks, the frontend would need to send the rule configuration directly, or a new endpoint would accept a custom rule payload.

### Portfolio & Asset Pages

Compliance verdicts (`COMPLIANT` / `NON_COMPLIANT`) are shown per-position and per-asset. Custom frameworks produce verdicts using the same rule evaluation pipeline.

---

## Future Enhancements

- **Backend persistence:** Store custom frameworks in the database, tied to user accounts
- **Framework templates:** Start from a clone of an existing built-in framework
- **Rule import/export:** Share custom frameworks as JSON
- **Collaborative frameworks:** Share with other users
- **Rule marketplace:** Community-contributed rule definitions
- **Audit trail:** Track when custom frameworks were used for evaluations

---

## Open Questions

1. Should custom frameworks be backend-persisted (requires API work) or localStorage-only for MVP?
2. How many rules should a user be able to include per framework? (Suggestion: no limit)
3. Should we support cloning an existing framework as a starting point?
4. What happens to custom frameworks when the user clears browser data? (Migration plan needed)

---

## Estimated Effort

| Task | Hours |
|------|-------|
| Data model + localStorage CRUD | 2h |
| Create modal (form + validation) | 3h |
| Framework card updates (custom badge, delete) | 1h |
| Framework detail updates (edit mode) | 2h |
| Compliance integration (rule mapping) | 3h |
| Top nav toggle updates | 1h |
| Testing & edge cases | 2h |
| **Total** | **~14h** |
