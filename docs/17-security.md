# 17 — Security

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Backend Engineering / DevSecOps
> **Audience:** Backend Engineers, DevOps, Compliance Officers
> **Depends On:** `11-backend-architecture.md`, `13-api-design.md`, `10-database-design.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [Authentication & Session Management](#5-authentication--session-management)
6. [Authorization & Access Control](#6-authorization--access-control)
7. [Vulnerability Prevention (OWASP)](#7-vulnerability-prevention-owasp)
8. [Data Integrity & Compliance Tampering](#8-data-integrity--compliance-tampering)
9. [Secrets Management & Infrastructure](#9-secrets-management--infrastructure)
10. [Tradeoffs](#10-tradeoffs)
11. [Risks](#11-risks)
12. [Future Expansion](#12-future-expansion)
13. [Dependencies](#13-dependencies)
14. [Engineering Notes](#14-engineering-notes)
15. [Recruiter Impact Notes](#16-recruiter-impact-notes)
16. [Business Impact Notes](#17-business-impact-notes)
17. [Document Cross-References](#18-document-cross-references)

---

## 1. Purpose

This document outlines the security posture of HalalTrade. Even though the platform operates initially with "paper" (virtual) money, the expectation of a Fintech application is absolute security. Users trust us with their financial philosophies and portfolio compositions. Furthermore, demonstrating institutional-grade security on the virtual MVP is a prerequisite for any future integration with real brokerage APIs (like Alpaca or Plaid).

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| SEC-1 | Protect User Identity | Implement secure, standard-compliant authentication with zero home-rolled password hashing. |
| SEC-2 | Isolate User Data | Ensure tenant isolation so User A can never read or modify User B's portfolio or custom framework thresholds. |
| SEC-3 | Defend the Engine | Protect the Compliance Framework JSONB configurations from unauthorized mutation. |
| SEC-4 | Prevent Abuse | Implement strict rate-limiting to prevent brute-force attacks and API scraping. |

---

## 3. Scope

### 3.1 In Scope
- Authentication patterns (NextAuth.js / Auth.js integration).
- Authorization boundaries (Resource ownership).
- Threat modeling for the specific Bounded Contexts (Trading, Compliance).
- Data at rest and data in transit encryption standards.

### 3.2 Out of Scope
- Detailed AWS/GCP IAM role definitions.
- SOC2 Type II audit compliance procedures (Reserved for Phase 4+).
- Physical infrastructure security.

---

## 4. Executive Summary

HalalTrade relies on established, battle-tested security primitives rather than custom implementations. 

**Authentication** is handled entirely by Auth.js (via OAuth providers like Google), offloading the risk of password management. **Authorization** is enforced at the API route level using a strict "Resource Ownership" model.

The most critical asset to protect is not the virtual cash, but the **Compliance Engine Data**. If a bad actor alters the `frameworks` table in PostgreSQL to change a Halal threshold from 33% to 90%, they compromise the spiritual and ethical integrity of the entire user base. Therefore, write access to core frameworks is heavily restricted, and API abuse is mitigated via aggressive Redis-backed rate limiting.

---

## 5. Authentication & Session Management

We explicitly avoid "rolling our own crypto."

### 5.1 OAuth 2.0 via Auth.js
- **Primary Method:** Google OAuth.
- **Why:** Reduces onboarding friction (critical for the `04-user-journeys.md` Guest-to-User funnel) and entirely offloads password storage, brute-force mitigation, and 2FA to Google.
- **Implementation:** `Auth.js` (formerly NextAuth) manages the handshake and generates the session.

### 5.2 Session Strategy
- **Type:** JSON Web Tokens (JWT).
- **Storage:** Secure, `HttpOnly`, `SameSite=Lax` cookies. The token is never exposed to Javascript via `document.cookie`, neutralizing standard XSS token-theft attacks.
- **Lifespan:** Short-lived tokens (e.g., 2 hours) with silent refresh mechanisms.

### 5.3 Traditional Auth (Email/Password) Fallback
If implemented, passwords are never stored in plain text.
- **Hashing Algorithm:** `Argon2id` (or `bcrypt` with a high work factor > 12).
- **Rule:** The system does not confirm whether an email exists during the "Forgot Password" flow to prevent user enumeration attacks.

---

## 6. Authorization & Access Control

Authentication verifies *who* the user is. Authorization verifies *what* they can do.

### 6.1 Resource Ownership Model (B2C)
Because HalalTrade is currently a B2C app, Role-Based Access Control (RBAC) is too complex for the MVP. We use a strict Resource Ownership model.

- **The Rule:** Every private resource (Portfolio, Order, FrameworkOverride) has a `user_id` foreign key.
- **The Enforcement:** Every mutable API endpoint (e.g., `POST /portfolio/orders`) must extract the `user_id` from the JWT and include it in the `WHERE` clause of the SQL query.
  ```typescript
  // SECURE: Automatically scopes the update to the authenticated user
  prisma.portfolio.update({
    where: { id: req.body.portfolioId, userId: req.user.id },
    data: { ... }
  });
  ```

### 6.2 Internal Admin Access
The endpoints supporting the internal admin dashboard (`/admin/system`) are protected by a strict middleware that checks for a specific `role: 'ADMIN'` claim within the JWT, or checks a whitelist of corporate email addresses.

---

## 7. Vulnerability Prevention (OWASP)

The platform must defend against the standard OWASP Top 10 vulnerabilities.

### 7.1 Cross-Site Scripting (XSS)
- **Threat:** Malicious scripts injected into the UI (e.g., a user putting `<script>` tags in their custom framework name).
- **Defense:** React automatically escapes string variables in the DOM. However, we strictly forbid the use of `dangerouslySetInnerHTML`.

### 7.2 SQL Injection (SQLi)
- **Threat:** Manipulating database queries.
- **Defense:** Using Prisma ORM inherently protects against SQLi via parameterized queries. Raw queries (`$queryRaw`) are strictly audited and must use Prisma's tagged template literals, never string concatenation.

### 7.3 Cross-Site Request Forgery (CSRF)
- **Threat:** Forcing an authenticated user's browser to execute unwanted actions (e.g., placing a bad trade).
- **Defense:** Because Auth.js uses `SameSite=Lax` cookies, modern browsers block cross-origin POST requests. For state-mutating requests, Next.js App Router Server Actions inherently implement anti-CSRF tokens.

### 7.4 Rate Limiting & DoS
- **Threat:** A user spamming the `POST /portfolio/orders` endpoint to crash the server or running a script to scrape all compliance data.
- **Defense:** Redis-backed Throttler (defined in `13-api-design.md`).
  - General API: 100 req / minute.
  - Order Execution: 10 req / minute per user.

---

## 8. Data Integrity & Compliance Tampering

This is a unique threat vector for HalalTrade.

### 8.1 Protecting the Frameworks
The `frameworks.default_rules` JSONB column dictates the Halal logic for the entire platform.
- **Defense:** This table is completely immutable via the public API. It can only be modified by a direct database script executed by an Admin, tracked via version control.

### 8.2 Protecting Market Data
If a bad actor can intercept the data flowing from our vendor (Polygon.io) and change Apple's Debt from $110B to $0, they can trick the engine into falsely passing Apple.
- **Defense:** All traffic between the HalalTrade backend and external vendors operates strictly over `HTTPS` (TLS 1.3). The Anti-Corruption Layer (ACL) rejects any response not matching the expected Zod schema.

---

## 9. Secrets Management & Infrastructure

### 9.1 Environment Variables
API Keys (Database URIs, Provider Keys, JWT Secrets) must never be committed to source control.
- **Development:** Uses `.env.local`.
- **Production:** Injected dynamically at runtime via the hosting provider's secure secret manager (e.g., Vercel Secrets, AWS Secrets Manager).

### 9.2 Data at Rest & Transit
- **Transit:** The entire application (Next.js + API) is forced over `HTTPS`. HTTP traffic is permanently redirected. HSTS headers are enabled.
- **At Rest:** The managed PostgreSQL database (e.g., Supabase, AWS RDS) must have AES-256 encryption-at-rest enabled.

---

## 10. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Auth Provider** | Auth.js (OAuth) | Custom JWT / Passwords | Offloading the immense security burden of password hashing and reset flows to Google/Apple allows the team to focus purely on the core product. |
| **Session Storage** | HttpOnly Cookies | LocalStorage JWTs | LocalStorage is accessible to any malicious Javascript running on the page (XSS). HttpOnly cookies are invisible to Javascript, neutralizing token theft. |
| **API Framework** | REST (NestJS) | GraphQL | Securing GraphQL against deeply nested, recursive query attacks requires complex query-depth limiting. REST endpoints are much easier to secure and rate-limit independently. |

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Dependency Supply Chain** | High | A malicious npm package is installed that steals environment variables. **Mitigation:** Rely on GitHub Dependabot for vulnerability scanning. Minimize third-party dependencies in the backend. |
| **Market API Key Leak** | Medium | The Polygon API key leaks, and someone burns our credit limit. **Mitigation:** Rotate keys regularly. Set strict usage caps on the vendor side. The key is only stored in backend environment variables, never sent to the frontend. |

---

## 12. Future Expansion

| Feature | Security Impact | Phase |
|---|---|---|
| **Real Brokerage API (Plaid)** | Requires immense security upgrades. Storing Plaid Access Tokens requires KMS (Key Management Service) level encryption. The platform must likely pass a basic SOC2 or equivalent audit before a broker allows integration. | Phase 3 |
| **Community Frameworks** | Allowing users to publish custom JSONB frameworks introduces an injection vector. The JSONB must be strictly sanitized to ensure it only contains valid rule IDs and floats, not malicious payloads. | Phase 5 |

---

## 13. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Auth.js** | Library | The backbone of the authentication system. |
| **Helmet** | Library | Used in the NestJS backend to automatically set secure HTTP headers (e.g., X-Frame-Options, Content-Security-Policy). |

---

## 14. Engineering Notes

- **The `WHERE` Clause Rule:** Every single `UPDATE` or `DELETE` Prisma query must include `userId: req.user.id`. There are no exceptions. Code reviews must reject any mutation that fetches an object by `id` alone without verifying ownership.
- **Log Sanitization:** When an API request fails, log the error for debugging, but *never* log `req.headers.authorization` or passwords. Create a specialized logger utility that strips sensitive keys before writing to `stdout`.

---

## 15. Recruiter Impact Notes

### 15.1 What This Document Demonstrates
- **DevSecOps Mentality:** Security is treated as a foundational architectural constraint, not a checklist applied at the end. The explicit choice of `HttpOnly` cookies over `LocalStorage` demonstrates mature web security knowledge.
- **Threat Modeling:** Identifying specific, domain-relevant threats—like the manipulation of the `frameworks` JSONB column destroying the ethical integrity of the app—shows the ability to look past generic OWASP lists and understand business risk.
- **Pragmatism:** Recognizing that home-rolling a JWT authentication system with passwords is a massive risk for a startup, and deliberately offloading it to Auth.js/OAuth to save time and increase security.

---

## 16. Business Impact Notes

- **Foundation for Real Money:** You cannot pivot from Paper Trading to Live Brokerage integration if your initial architecture has leaky permissions. This architecture ensures the platform is fundamentally secure enough to handle real PII and financial tokens when Phase 3 arrives.
- **Brand Reputation:** In Islamic Finance and ESG, trust is everything. A single data breach or a manipulated framework rule would instantly destroy the platform's credibility. The strict immutability rules defined here protect the core brand value.

---

## 17. Document Cross-References

| Document | Relationship |
|---|---|
| `13-api-design.md` | Defines the specific REST endpoints that must be protected by the Authorization rules defined here. |
| `10-database-design.md` | The framework tables mentioned here are structurally defined in the Database ERD. |
| `11-backend-architecture.md` | The NestJS monolith enforces the routing guards and Middleware necessary to execute this security plan. |

---

> **End of Document**
>
> Security is a continuous process. Any new major feature must be reviewed against this document to ensure it does not introduce new IDOR (Insecure Direct Object Reference) vulnerabilities.
