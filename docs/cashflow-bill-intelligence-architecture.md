# Predictive Cash Flow & Bill Intelligence — Architecture (Phase 2)

## Goals

Deterministic, traceable answers to: **“Will I have enough money over the next 7, 14, and 30 days?”**

No fake charts, no synthetic merchant intelligence, no duplicate ledger or notification tables.

---

## Data sources (read-only aggregation)

| Input | Prisma | Use |
|-------|--------|-----|
| Ledger history | `FinancialTransaction` | Recurrence detection (≥90d lookback MVP). |
| Obligations (explicit) | `RecurringBill` | Scheduled outflows; advance `nextDueDate` per `frequency` string (supported: weekly, biweekly, monthly, quarterly — normalized). |
| Cash snapshot | `BankAccount` | `startingBalance = Σ max(availableBalance, currentBalance, 0)` on active accounts (deterministic rule documented in payload). |
| Receivables | `Invoice` | Pending/sent/overdue/draft-as-needed — **only statuses not `paid`/`failed`** → expected **inflow** on `dueDate` (assumption: payment arrives on due date). |
| Allocation signal | `SmartAllocation` + `AutomationExecution` | Recent allocation totals → **allocation pressure** heuristic. |

---

## 1. Recurring obligation detection (`lib/cashflow/recurrence.ts`)

**Scope:** `FinancialTransaction` where `direction === OUTFLOW`, exclude transfers when `metadata`/classification hints transfer (reuse `isTransferDescription` where available).

**Grouping key:** normalized `merchantName ?? description` (lowercase, collapsed whitespace, trim).

**Amount:** median absolute `amount` per group.

**Cadence:** consecutive intervals between `postedAt` (days); classify:

| Median interval (days) | Cadence label |
|------------------------|---------------|
| 6–8 | weekly |
| 13–15 | biweekly |
| 27–33 | monthly |
| 85–95 | quarterly |

Otherwise **unknown** — exclude from projection but optional explain list.

**Confidence:** `min(1, nOccurrences / 8) * stability`, where stability ∈ [0,1] from coefficient of variation of intervals (capped).

**Tolerance:** expected amount band ±15% for matching future occurrences.

**Next expected date:** last occurrence + median interval, rolled forward until ≥ today (cap iterations).

**User correction later:** MVP persists nothing new; future table could store overrides keyed by group id.

---

## 2. Recurring income detection

Same pipeline with `direction === INFLOW`, separate grouping; cadence rules identical.

Interpret as **expected deposits** (paycheck/gig/platform patterns only as statistical labels — no vendor-specific ML).

---

## 3. Forecast windows (`lib/cashflow/forecast.ts`)

For `windowDays ∈ {7,14,30}`:

1. Build ordered **cashflow events** on timeline `[today, today+window]`:
   - Each obligation instance (RecurringBill rolled forward within window).
   - Each detected recurring obligation occurrence (rounded to calendar day).
   - Each detected recurring income occurrence.
   - Each unpaid invoice → single inflow on `dueDate` if `dueDate` falls in window.
2. Sort events by date.
3. Walk day-by-day **running balance**:
   - Start at `startingBalance`.
   - Apply all events on that calendar day (UTC midnight boundaries — **document assumption**: use local date from server TZ or ISO date-only; MVP uses **UTC date parts from JS Date** consistently).
4. Outputs per window:
   - `projectedEndingBalance`
   - `lowestProjectedBalance` + `lowestProjectedBalanceDate`
   - Totals: expected income, bills (outflows), allocation impact (see below)

**Allocation impact (deterministic heuristic):**

`expectedAllocationImpact = min(recentWeeklyAllocationEstimate, startingBalance * 0.25)` capped sanely — where `recentWeeklyAllocationEstimate = sum(SmartAllocation.amount where createdAt >= now-28d) / 4` (if zero, fall back to 0). Spread evenly across 7-day buckets inside window as optional detail — MVP applies **one lump weekly deduction** mid-window for explain simplicity OR linear spread across weeks — **implementation:** distribute daily `(totalImpact / windowDays)` as constant daily allocation drag to avoid cliff artifacts.

Actually simpler for MVP: dailyAllocationDrag = totalImpact / windowDays subtracted every day from running balance (deterministic smooth curve).

---

## 4. Timing risk analysis (`lib/cashflow/risk.ts`)

Emit structured risks with codes:

| Code | Condition |
|------|-----------|
| `PROJECTED_LOW_BALANCE` | `lowestProjectedBalance < max(threshold, 0)` where threshold = `STACKZEN_LOW_BALANCE_ALERT_USD` default 100 |
| `BILLS_BEFORE_NEXT_INCOME` | Chronologically: next obligation date **before** next income date inside window with running balance trending down |
| `BILL_CLUSTER` | ≥3 obligations same calendar day |
| `ALLOCATION_PRESSURE` | `startingBalance - lowestProjectedBalance > startingBalance * 0.4` AND allocation drag > 0 (heuristic) |
| `INVOICE_RECEIVABLE_GAP` | Sum unpaid invoice amounts due in window **>** projected ending balance without those inflows (cross-check) — optional |

Overlap with **`ensureOperationalAttentionNotifications`**: cash-flow alerts use **`attentionKind`** prefix `cashflow_*`; invoice overdue already covered — skip duplicate **`cashflow_`** alert for same invoice id where possible.

---

## 5. Explainability (`lib/cashflow/explain.ts`)

Every API response includes:

- `inputsUsed`: counts, date ranges, account ids (optional), bill ids  
- `assumptions`: string[] (UTC dating, invoice paid on due date, median cadence, etc.)  
- `sourceTransactionSampleIds`: capped list of transaction ids contributing to a recurrent pattern  
- `confidence`: aggregate **low/medium/high** from weakest recurrent pattern or explicit bills  

---

## 6. Operational actions (`AutomationNotification.metadata`)

Extend **`AutomationClientAction`** with **`OPEN_CASH_FLOW`** → `/cash-flow`.

Risk alerts include actions:

- `OPEN_CASH_FLOW`, `EDIT_ALLOCATION_RULE`, `OPEN_INVOICE`, `OPEN_JOB`, `REVIEW_TRANSACTION` (sample txn from pattern when present), `SNOOZE`.

---

## 7. Operational Center integration

- **`ensureCashflowAttentionNotifications(userId)`** called from same path as other ensures (operational alerts GET) **or** merged file — **idempotent** by `(userId, attentionKind)` query.
- No new tables.

---

## 8. FinancialEvent strategy

Prisma migration adds:

- `FinancialEventType.CASHFLOW_FORECAST_GENERATED`
- `FinancialEventType.CASHFLOW_RISK_DETECTED`

**Emit policy (MVP):**

- On **creating** a new cash-flow risk notification (first time idempotent insert path), emit **`CASHFLOW_RISK_DETECTED`** with metadata `{ codes: [...], windowDays }`.  
- Optionally emit **`CASHFLOW_FORECAST_GENERATED`** when `includeDetails=true` and **once per request** — **disabled by default** to reduce noise; prefer risk-only events until product defines retention policy.

---

## 9. API contract

`GET /api/cashflow/forecast?window=7|14|30&includeDetails=true|false`

- Auth: **`requireAuthSession`**
- Response: forecast + explain + risks[] + optional daily series when `includeDetails`

---

## 10. Scalability & limits

- Transaction fetch capped (e.g. 5000 rows / 180 days).  
- Pattern groups capped at top N by total flow.  
- All queries `where: { userId }`.

---

This architecture avoids duplicate systems and keeps every number traceable to ledger rows or explicit bill/invoice records.
