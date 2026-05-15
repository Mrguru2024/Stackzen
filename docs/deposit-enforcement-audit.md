# Deposit Enforcement MVP — Audit

## Job deposit-related fields (before change)

- `depositPercentage` (optional, default 0) — used when generating deposit invoice amount.
- `depositPaid` (float) — rolled up from paid **deposit** invoices in `recomputeJobRevenue`.
- `remainingBalance` — heuristic from contract vs deposit; also updated in deposit/final invoice routes.
- **Gaps:** No explicit **deposit required** flag, no **fixed** deposit amount, no **waive** flag, no persisted **deposit compliance status** separate from payment totals.

## Invoice / deposit routes

- `POST /api/jobs/[jobId]/deposit-invoice` — builds deposit from `estimatedAmount * depositPercentage`, sets job `DEPOSIT_PENDING`. **Unconditional:** any authenticated user with `estimatedAmount` can create; **no** `depositRequired` gate.
- `POST /api/jobs/[jobId]/final-invoice` — `remainingAmount = contractTotal - paidDeposits` (deposit invoices with `status: paid`). **Already** subtracts paid deposits.

## Job status transitions

- `PATCH /api/jobs/[jobId]` — can set any `JobStatus` including `IN_PROGRESS` **without** checking deposits.
- `POST .../deposit-invoice` — forces `DEPOSIT_PENDING`.
- Stripe webhook — on invoice payment, updates job status to `PAID` / `AWAITING_PAYMENT` from pending invoice counts (may override workflow).

## Stripe webhook

- `updateInvoiceFromStripeMetadata` → `recomputeJobRevenue` when `invoice.jobId` set.
- Emits `INVOICE_STATUS_CHANGED` only — **no** dedicated deposit-paid event.

## Job detail UI (`components/JobDetail/index.tsx`)

- Shows `jobRevenue`, `jobExpenses`, `estimatedProfit`, `remainingBalance` — **no** explicit deposit policy or compliance messaging.

## `lib/jobs/revenue.ts`

- Single rollup: paid invoices (all types) → `jobRevenue`; deposit subset → `depositPaid`; expenses → `jobExpenses`.
- **Does not** compute REQUIRED vs PAID vs WAIVED for **gating** work start.

## Risks / duplication to avoid

- Do **not** add a second billing or invoice total engine — extend **Job** + **recomputeJobRevenue**.
- Do **not** duplicate `FinancialEvent` — add narrow event **types** for deposit policy / paid / waived.

## MVP design (summary)

- Add **job-level** policy fields + **`depositStatus`** (derived/stored in same rollup pass as revenue).
- **Guard** only transition to **`IN_PROGRESS`** when `depositRequired` and deposit not satisfied (unless **waived**).
- **Do not** block jobs globally; default **`depositRequired: false`**.
- **Deposit invoice** route only when policy requires deposits (or explicit product rule: **require** `depositRequired === true` to generate deposit invoice).

### Conditional logic (reference)

| `depositRequired` | Behavior |
|-------------------|----------|
| `false` | `depositStatus` → `NOT_REQUIRED`; no In progress guard; UI: “No deposit required”. |
| `true` | Required amount from `PERCENTAGE` + `estimatedAmount` or `FIXED_AMOUNT` + `depositFixedAmount`; `depositStatus` from paid deposit invoices vs required; In progress only if **PAID** or **WAIVED** (not partial). |
| Waived | `depositWaived` + status **WAIVED**; In progress allowed without deposit payment. |

**Final invoice** continues: `contractTotal - paidDepositInvoices` (unchanged math).
