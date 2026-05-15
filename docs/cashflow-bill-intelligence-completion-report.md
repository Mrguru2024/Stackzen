# Predictive Cash Flow & Bill Intelligence — Completion Report (Phase 5)

## Documentation

| File | Purpose |
|------|---------|
| [cashflow-bill-intelligence-audit.md](./cashflow-bill-intelligence-audit.md) | Phase 1 inventory of ledger, bills, automation, operational queue, gaps |
| [cashflow-bill-intelligence-architecture.md](./cashflow-bill-intelligence-architecture.md) | Deterministic forecast design, explainability, Operational integration |

## Files audited (representative)

`prisma/schema.prisma`, `lib/bank/sync-runner.ts`, `lib/financial-automation/transactions.ts`, `lib/financial-automation/rules-engine.ts`, `lib/operational-notifications/ensure-attention.ts`, `app/api/operational-center/alerts/route.ts`, `components/money-control/index.tsx`, `components/operational-center/*`, `docs/automated-budget-workflow-audit.md`.

## Files changed / added

### Prisma

- **`FinancialEventType`**: `CASHFLOW_FORECAST_GENERATED`, `CASHFLOW_RISK_DETECTED` (+ migration `20260509120000_add_cashflow_financial_events`).

### Libraries

| Path | Role |
|------|------|
| `lib/cashflow/constants.ts` | Low-balance threshold alignment with automation env |
| `lib/cashflow/types.ts` | DTOs for forecast, risks, recurrence |
| `lib/cashflow/recurrence.ts` | Ledger clustering → cadence, median amount, next date |
| `lib/cashflow/forecast.ts` | Loads Prisma data (scoped `userId`), builds 7/14/30 windows |
| `lib/cashflow/risk.ts` | Timing risks + dedupe by code |
| `lib/cashflow/explain.ts` | Assumptions + confidence tier |
| `lib/cashflow/ensure-cashflow-attention.ts` | Idempotent **`AutomationNotification`** upserts + **`CASHFLOW_RISK_DETECTED`** event on create |

### API

- **`GET /api/cashflow/forecast`** — Zod (`window` optional, `includeDetails`), **`requireAuthSession`**, no cross-user leakage.

### UI / navigation

- **`app/(dashboard)/cash-flow/page.tsx`** + **`components/cash-flow/CashFlowView/index.tsx`** — Summary cards, risks, detected lists, explain block (**no fake charts**).
- **`config/nav-links.ts`** — **Cash Flow** entry.
- **`components/money-control/index.tsx`** — **Cash flow outlook** button.
- **`components/operational-center/OperationalAlertCenter/index.tsx`** — **Cash flow** quick link.

### Actions / notifications

- **`OPEN_CASH_FLOW`** in `lib/financial-automation/actionable-metadata.ts`.
- **`components/operational-center/OperationalAlertCards/index.tsx`** — routes action to **`/cash-flow`**.
- **`lib/operational-notifications/enrich.ts`** — `cashflow_*` **`attentionKind`** maps to **financial** domain (before generic “deposit” billing heuristic).

## Systems reused (no duplicates)

- **`FinancialTransaction`** — recurrence detection source.
- **`RecurringBill`** — explicit obligations.
- **`BankAccount`** — starting balance.
- **`Invoice`** — unpaid receivables modeled as inflows on due dates (documented assumption).
- **`SmartAllocation`** — trailing allocation pace for pressure heuristic.
- **`Job`** — deposit-pending count for runway risk.
- **`AutomationNotification`** — single attention queue.
- **`FinancialEvent`** — optional **`CASHFLOW_RISK_DETECTED`** on first alert create.
- **`createAutomationNotification`** — existing notification + **`AUTOMATION_NOTIFICATION_CREATED`** path.

## Duplicate systems avoided

- No second forecast table or parallel ledger.
- No passive-only widgets; UI binds to **`GET /api/cashflow/forecast`**.
- No placeholder merchant “AI” — patterns are median-interval statistics.

## Recurrence detection status

- **Implemented:** merchant/description grouping, ≥3 occurrences, median interval → cadence (weekly/biweekly/monthly/quarterly), median amount, sample transaction ids, next expected date.
- **Excluded:** `unknown` cadence from projection (see assumptions).

## Forecast API status

- **Live:** `GET /api/cashflow/forecast` returns three windows (or filtered when `window=` set) + obligations/income lists + risks + explain payload.

## Risk detection status

- Codes: `PROJECTED_LOW_BALANCE`, `BILLS_BEFORE_NEXT_INCOME`, `BILL_CLUSTER`, `ALLOCATION_PRESSURE`, `INVOICE_RECEIVABLE_GAP`, `DEPOSIT_RUNWAY_WARNING`.
- Deduped by **`code`** keeping strongest severity.

## Operational Center integration

- **`ensureCashflowAttentionNotifications`** runs after invoice/job ensure when **`ensure=true`** on **`GET /api/operational-center/alerts`**.
- Alerts carry **`OPEN_CASH_FLOW`** primary action.

## UI action readiness

- Links to **`/cash-flow`**, **`/money-control`**, **`/operational-center`**, **`/financial-timeline`**.
- Operational alert cards resolve **`OPEN_CASH_FLOW`** to **`/cash-flow`**.

## Validation results (run locally)

| Command | Notes |
|---------|--------|
| `npx prisma validate` | Requires **`DIRECT_URL`** in env (mirror **`DATABASE_URL`** for Supabase if missing). |
| `npx prisma generate` | After schema enum change; on Windows, retry if **`EPERM`** when renaming the query engine (IDE/other process lock). |
| `npm run typecheck` | Passed in CI workspace run. |
| `npx jest lib/cashflow components/cash-flow/CashFlowView/CashFlowView.test.tsx --passWithNoTests` | Passed (**cadence + Cash Flow view smoke**). |

## Remaining production gaps

1. **Enum migration:** Apply migration to hosted DB before relying on new **`FinancialEventType`** values.
2. **Double-counting:** Explicit **`RecurringBill`** rows may overlap statistically detected obligations if labels differ—documented in explain assumptions.
3. **Invoice inflow timing:** Receivables assumed on **`dueDate`**; late payments not modeled.
4. **Timezone:** Day buckets use server **`Date`** math—documented as UTC/JS behavior.
5. **`CASHFLOW_FORECAST_GENERATED`:** Reserved in schema; **not** emitted on every API poll (noise control)—only **`CASHFLOW_RISK_DETECTED`** on new alert row creation.
6. **Stale cash-flow alerts:** When risks clear, existing notifications are **not** auto-dismissed (same pattern as other ensures).

## Guarded production readiness

**Suitable for internal / pilot** when users understand assumptions and migration is applied. Harden with user timezone, merchant merge rules, and reconciliation when risks resolve.
