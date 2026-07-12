# 15 — Paper Trading Engine

> **Document Status:** Living Document · v1.0
> **Last Updated:** 2026-06-25
> **Owner:** Backend Engineering
> **Audience:** Backend Engineers, Product Managers
> **Depends On:** `09-domain-models.md`, `10-database-design.md`, `11-backend-architecture.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Goals](#2-goals)
3. [Scope](#3-scope)
4. [Executive Summary](#4-executive-summary)
5. [The Execution Pipeline](#5-the-execution-pipeline)
6. [Concurrency & Race Conditions](#6-concurrency--race-conditions)
7. [Market Hours & Asynchronous Execution](#7-market-hours--asynchronous-execution)
8. [Fractional Shares & Precision Math](#8-fractional-shares--precision-math)
9. [The Portfolio Ledger](#9-the-portfolio-ledger)
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

This document details the mechanics of the Virtual (Paper) Trading Engine. 
While the Compliance Framework Engine (`14-compliance-engine.md`) handles the ethical logic, this engine handles the financial ledger. Even though the money is virtual, the engineering rigor must mirror a real brokerage. If a user can trigger a race condition to duplicate their virtual balance, they will immediately lose trust in the platform's ability to handle their compliance logic or future real-world integrations.

---

## 2. Goals

| # | Goal | Measure |
|---|---|---|
| TE-1 | Prevent Race Conditions | 100% protection against "double-spend" errors using Postgres transaction locks. |
| TE-2 | Guarantee Precision | Zero usage of floating-point math during trade execution. |
| TE-3 | Simulate Reality | Accurately delay order execution if the stock market is currently closed. |
| TE-4 | Maintain Compliance Isolation | The trading engine must not contain any `is_halal` checks. It only handles quantities, prices, and cash. |

---

## 3. Scope

### 3.1 In Scope
- The order validation and execution lifecycle.
- Concurrency management (Optimistic/Pessimistic locking).
- Market hour validation logic.
- Ledger math for positions and average price calculations.

### 3.2 Out of Scope
- Real-world brokerage integrations (Plaid/Alpaca) — This is reserved for Phase 3.
- Advanced order types (Stop-Loss, Trailing Stops) — MVP is restricted to Market and Limit orders.

---

## 4. Executive Summary

The Paper Trading Engine is a strictly isolated bounded context. It takes `Orders` as input, validates them against the user's `Portfolio` balances, fetches the current price from the `Market Data` context, and writes immutable `Transactions` to the ledger.

It relies heavily on PostgreSQL ACID properties (specifically `SELECT ... FOR UPDATE`) to prevent concurrent order submissions from over-drafting a user's virtual cash. It accurately simulates fractional share buying and calculates Average Cost Basis exactly like a traditional broker.

---

## 5. The Execution Pipeline

When an `Order` is submitted via `POST /portfolio/orders`, it follows a strict pipeline.

### 5.1 Validation Phase
1. **Sanity Check:** Ensure quantity > 0 and the asset ticker exists.
2. **Buying Power Check:** Fetch the portfolio's `available_cash_cents`. If the estimated total (Qty * Current Price) > `available_cash_cents`, immediately reject with `400 Bad Request`.
3. **Asset Ownership Check (Sells):** If it's a `SELL` order, verify the `Portfolio` has an open `Position` for the asset and `Position.quantity >= Order.quantity`.

### 5.2 Market Hours Phase
1. **Clock Check:** Query the Market Calendar utility.
2. **If Closed:** Change the order status to `PENDING` and dispatch a job to the `BullMQ` order-execution queue, scheduled for 9:30 AM EST on the next trading day.
3. **If Open:** Proceed immediately to the Execution Phase.

### 5.3 Execution Phase (The Database Transaction)
*All steps below must happen inside a single Postgres `BEGIN ... COMMIT` block.*
1. **Lock the Portfolio:** Acquire a write lock on the `portfolios` row to block concurrent trades.
2. **Fetch Exact Price:** Get the real-time quote from the Market Data module.
3. **Calculate Totals:** `total_cost_cents = qty * exact_price`.
4. **Update Cash:** Deduct (for BUY) or add (for SELL) `total_cost_cents` to the `Portfolio`.
5. **Update Positions:** Add/subtract the `qty` from the `positions` table. (If a new asset, create the row).
6. **Write Transaction Ledger:** Insert an immutable row into the `transactions` table recording the exact execution details (`order_id`, `quantity`, `price_per_share_cents`, `total_amount_cents`). This provides a mathematically reconstructable history.
7. **Mark Executed:** Update the `Order` status to `EXECUTED`, setting its `executed_price_cents` and `executed_at` timestamp.

---

## 6. Concurrency & Race Conditions

The most critical vulnerability in any trading system is the "Double Spend."

### The Attack Scenario
A user has $1,000 in virtual cash. They write a script to fire two `BUY` requests for $1,000 of AAPL at the exact same millisecond. 
- Thread 1 checks balance: sees $1,000. (Passes)
- Thread 2 checks balance: sees $1,000. (Passes)
- Both threads deduct $1,000. The user now owns $2,000 of AAPL and has a -$1,000 balance.

### The Mitigation (Pessimistic Locking)
We utilize Postgres Row-Level Locks during the Execution Phase.

```typescript
// Using Prisma's transaction API conceptually
prisma.$transaction(async (tx) => {
  // 1. SELECT FOR UPDATE locks the row until transaction commits/rolls back
  const portfolio = await tx.$queryRaw`
    SELECT available_cash_cents FROM portfolios WHERE id = ${portfolioId} FOR UPDATE
  `;

  // 2. Validate again inside the lock
  if (portfolio.available_cash_cents < totalCostCents) {
    throw new InsufficientFundsError();
  }

  // 3. Execute updates...
});
```
Thread 2 will be forced to wait at Step 1 until Thread 1 finishes and updates the balance to $0. Thread 2 then reads $0, fails the validation, and throws the error.

---

## 7. Market Hours & Asynchronous Execution

Financial markets are closed nights, weekends, and holidays.

### 7.1 The Market Calendar
We use a lightweight, static library (e.g., `date-fns-tz` + a NYSE holiday map) rather than calling an external API to check if the market is open. Relying on an external API for market-open checks introduces an unacceptable point of failure for core trade execution.

### 7.2 The BullMQ Execution Loop
If a user places a Market Order at 8:00 PM:
1. The API responds `201 Created` with status `PENDING`.
2. A job is added to the Redis Queue: `{ orderId: '123' }` with a `delay` set to the millisecond difference between now and the next market open (e.g., 9:30 AM EST).
3. At 9:30 AM, the BullMQ worker picks up the job.
4. It fetches the *Opening Price* of the asset.
5. It runs the exact same database transaction block defined in Section 5.3.
6. **Crucial:** The job might fail if the user spent their cash on something else during pre-market. In this case, the order status becomes `FAILED`.

---

## 8. Fractional Shares & Precision Math

### 8.1 Decimal Math
Javascript natively uses IEEE 754 floating-point numbers. `0.1 + 0.2 === 0.30000000000000004`. If this happens in a trading engine, positions will never exactly reach `0.0000` when sold entirely, creating "dust" in the database.

**Rule:** All math involving share quantities must be executed using the `decimal.js` library.
```typescript
import { Decimal } from 'decimal.js';

// Correct:
const newQty = new Decimal(currentQty).plus(new Decimal(orderQty)).toNumber();
```

### 8.2 Currency Math
As defined in the Database Schema, all currency is stored as `BIGINT` representing cents.
**Rule:** When calculating order totals, multiply the decimal quantity by the integer price, then strictly `Math.floor()` the result to ensure the final deduction is an exact integer of cents.

---

## 9. The Portfolio Ledger

### 9.1 Average Price (Cost Basis) Calculation
When a user buys more of a stock they already own, the `average_price_cents` must be updated using a volume-weighted average.

**Formula:**
```text
New Avg Price = ( (Old Qty * Old Avg Price) + (New Qty * Executed Price) ) / (Old Qty + New Qty)
```
*Note: Selling shares does not change the average price; it only changes the quantity.*

### 9.2 Realized vs. Unrealized PnL & Account Statements
- **Unrealized PnL:** Calculated entirely on the frontend (or via a read-only API) by comparing the `Positions` table's `average_price_cents` against the live Market Quote. It is *not* stored in the database.
- **Realized PnL:** The actual profit/loss locked in when selling. In the MVP, this is calculated implicitly by the increase/decrease in `available_cash_cents`.
- **Audit & Tax Reporting:** Because every trade creates an immutable row in the `transactions` table, the platform can easily generate end-of-year Account Statements, support historic portfolio reconstruction (re-running the ledger math from day 1), and provide data for future tax reporting integrations.

---

## 10. Tradeoffs

| Decision | Chosen Option | Alternative | Rationale |
|---|---|---|---|
| **Locking Strategy** | Pessimistic (`FOR UPDATE`) | Optimistic (Version columns) | Pessimistic locking is slightly slower but guarantees zero race conditions without requiring the application logic to handle complex retry loops for failed optimistic updates. |
| **Market Data Source** | 15-Min Delayed | Real-time Streaming | Real-time data costs thousands of dollars a month. Delayed data is essentially free and perfectly acceptable for a platform focused on long-term compliance rather than day-trading arbitrage. |

---

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Delayed Execution Failures** | High | A massive spike in queued orders at 9:30 AM could overwhelm the BullMQ worker, executing trades at 9:35 AM prices instead. **Mitigation:** Scale the Redis workers horizontally. Ensure the execution logic checks the `timestamp` of the quote to ensure it is actually the opening price. |
| **Stock Splits / Mergers** | High | If AAPL does a 4-for-1 split, the user's `Position` quantity is suddenly wrong, destroying their portfolio value. **Mitigation:** A daily cron job must poll a Corporate Actions API and retroactively update `Position` quantities and average prices for affected tickers. |

---

## 12. Future Expansion

| Feature | Engine Impact | Phase |
|---|---|---|
| **Live Brokerage Integration** | We will replace the internal Execution Phase (Section 5.3) with an API call to Alpaca/Interactive Brokers. The internal DB becomes a read-replica of the broker's truth. | Phase 3 |
| **Short Selling & Margin** | Extremely unlikely due to strict Halal compliance rules, but if added, would require complex "Maintenance Margin" calculations running on every tick. | Out of Scope |

---

## 13. Dependencies

| Dependency | Type | Impact |
|---|---|---|
| **Decimal.js** | Library | Essential for preventing fractional share corruption. |
| **BullMQ / Redis** | Infra | The backbone of the asynchronous market-hours simulation. |

---

## 14. Engineering Notes

- **Separation of Concerns:** The `TradingService` must never accept `isHalal` as an argument or check it. It is entirely possible (and legal within the system) for a user to place a paper trade on a non-compliant asset. The UI handles warning the user; the Trading Engine simply executes the math.
- **Transaction Boundaries:** Do not make external HTTP API calls (e.g., fetching market data) *inside* the Postgres `BEGIN ... COMMIT` block. Fetch the price, *then* start the transaction. Holding a DB lock while waiting for an external API will exhaust the database connection pool.

---

## 15. Recruiter Impact Notes

### 15.1 What This Document Demonstrates
- **Fintech Rigor:** Shows a deep understanding of the unique constraints of financial software: floating-point math dangers, database locking mechanisms for race conditions, and volume-weighted average cost calculations.
- **Systems Design:** The ability to map out the asynchronous queueing required to handle real-world edge cases (market hours) proves an ability to design systems that exist outside simple synchronous Request/Response cycles.
- **Pragmatism:** Choosing pessimistic locking over optimistic locking, and explicitly defining the order of operations for database transactions (fetch API *then* lock DB), shows battle-tested engineering experience.

---

## 16. Business Impact Notes

- **User Trust:** By ensuring the paper trading engine never glitches or shows "dust" balances (e.g., $0.00001), users treat the platform as a serious institutional tool. This trust is the prerequisite for converting them to a paid tier or linking real brokerage accounts in the future.
- **API Cost Control:** By handling execution internally against 15-minute delayed data, the platform can support hundreds of thousands of daily paper trades without incurring execution fees from a real brokerage API.

---

## 17. Document Cross-References

| Document | Relationship |
|---|---|
| `09-domain-models.md` | Provides the definition of the `Portfolio` and `Order` entities modified by this engine. |
| `10-database-design.md` | Defines the specific `BIGINT` and `DECIMAL` columns this engine writes to. |
| `04-user-journeys.md` | Maps the UI flow of the user confirming the order that triggers this engine. |

---

> **End of Document**
>
> Any changes to the core `Portfolio` ledger math must be paired with extensive automated regression tests simulating high-concurrency order placements.
