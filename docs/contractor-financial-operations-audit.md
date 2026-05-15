# Contractor & hybrid earner financial operations — Phase 1 audit

This audit maps **existing** StackZen systems that support contractor/freelance/hybrid **operational cash** (jobs, invoices, deposits, expenses, ledger, forecast, guidance, workspace) — before adding a dedicated contractor operations layer.

## 1. Existing contractor / business systems

| Area | Location | Role |
|------|----------|------|
| **Job model** | `prisma/schema.prisma` (`Job`) | Lifecycle `JobStatus`, deposit policy fields (`depositRequired`, `depositType`, `depositWaived`, …), `depositPaid`, `remainingBalance`, `jobRevenue`, `jobExpenses`, `estimatedProfit`, `estimatedAmount`. |
| **Invoice model** | `Invoice` | `dueDate`, `amount`, `status`, `jobId`, `invoiceType` (`deposit` vs `standard`/final patterns), Stripe fields for collection. |
| **Expense model** | `Expense` | `jobId` optional link — job-scoped spend for profitability. |
| **Client** | `Client` | Payer identity for invoices/jobs. |
| **Income profile hints** | `Job.incomeProfileType` | Optional linkage to earner context (not a second CRM). |

## 2. Existing profitability systems

| Area | Location | Role |
|------|----------|------|
| **Job P&L recompute** | `lib/jobs/revenue.ts` (`recomputeJobRevenue`) | Deterministic: `jobRevenue` = sum **paid** invoice amounts; `depositPaid` from paid deposit invoices; `jobExpenses` = sum `Expense` for job; `estimatedProfit = jobRevenue - jobExpenses`; `remainingBalance` from `estimatedAmount`; `depositStatus` via `resolveDepositStatus`. **No synthetic margin** — derived from paid revenue and recorded expenses. |
| **Deposit math** | `lib/jobs/deposit-status.ts` | `getRequiredDepositAmount`, `resolveDepositStatus`, `canStartWorkWhileDepositRequired`. |

## 3. Existing invoice / deposit workflows

| Area | Location | Role |
|------|----------|------|
| **Status derivation** | `lib/jobs/derive-status-from-payment.ts`, `apply-status-from-payment.ts` | Job status transitions from invoice payment state + deposit policy (incl. `DEPOSIT_PENDING`). |
| **Stripe / webhooks** | `app/api/webhooks/stripe/**` (referenced from apply-status) | Payment events drive recomputation. |
| **Operational attention** | `lib/operational-notifications/ensure-attention.ts` | Per-invoice `invoice_overdue` / `invoice_due_soon`; per-job `job_deposit_required` / `job_awaiting_payment` with `OPEN_JOB`, `OPEN_INVOICE`, `PAY_INVOICE` actions. |

## 4. Existing operational risk systems

| Area | Location | Role |
|------|----------|------|
| **Cashflow risks** | `lib/cashflow/risk.ts` | Includes `INVOICE_RECEIVABLE_GAP`, allocation/low-balance risks — forecast-linked. |
| **Guidance** | `lib/guidance/engine.ts` | Overdue invoice batch, invoice cluster due, contractor-adjacent copy where risks exist. |
| **Income intelligence** | `lib/income-intelligence/**` | Irregular / delayed **personal** inflows on ledger — complementary to B2B receivables. |
| **Operational action engine** | `lib/operational-actions/**` | User-approved mutations (pause allocation, goal catch-up, extend deadline) — not job billing automation. |
| **Reconcile attention** | `lib/operational-state/reconcile-derived-attention.ts` | Auto-resolves invoice/job business rows when entity state changes. |

## 5. Existing reserve logic

| Area | Location | Role |
|------|----------|------|
| **Guidance emergency reserve** | `lib/guidance/engine.ts` | Suggests `EMERGENCY_FUND` goal when cushion thin — same SmartAllocation path as other goals. |
| **Cashflow + goals** | `lib/goals/analyze.ts`, `buildCashFlowForecast` | Reserve pressure from allocation drag + goal pace. |
| **No separate “tax reserve” ledger** | — | Tax buckets would be a future explicit product choice; not invented here as fake metrics. |

## 6. Existing explainability systems

| Area | Location | Role |
|------|----------|------|
| **Operational trust + explain** | `buildOperationalAttentionMetadata`, `buildOperationalExplainability` | Standard pattern for notifications. |
| **FinancialEvent** | `JOB_DEPOSIT_PAID`, job/invoice events | Audit trail on deposit transitions and API flows. |

## 7. Duplication risks (mitigated in design)

| Risk | Mitigation |
|------|------------|
| Second profitability engine | Surface **`recomputeJobRevenue` outputs only**; never re-derive revenue/expense totals in parallel. |
| Second overdue-invoice system | Do **not** create per-invoice duplicate alerts; contractor layer uses **aggregate** signals (`contractor_ops_*`) + links to existing `/jobs` / `/invoices`. |
| Generic CRM | No new Client/Job CRUD; **read-only intelligence** + existing deep links. |

## 8. Missing contractor-finance workflows (before implementation)

- **Cross-job** “material exposure” view: expenses vs **deposit collected** while deposit policy unsatisfied (operational, not accounting).
- **Portfolio-level** negative `estimatedProfit` visibility on Operations hub (not only job detail).
- **Receivable concentration** by client on **open** invoices (deterministic HHI-style index).
- **Reserve / cash timing** nudges that explicitly tie **job + invoice + forecast** language together for hybrid earners.

## 9. Recommended operational architecture

1. **`buildContractorFinancialOpsSnapshot(userId)`** — single Prisma-backed DTO: jobs (selected fields), material exposure list, negative-margin jobs, open receivables + concentration, reserve nudges (text + forecast risk codes).
2. **`ensureContractorOperationalAttentionNotifications`** — fixed `attentionKind` rows (`contractor_ops_*`) upserted like bank/income intel; **mark read** when signals clear.
3. **`GET /api/operational-center/contractor-operations`** — snapshot + optional `ensure`.
4. **Workspace panel** — `ContractorFinancialOperationsPanel` embedded in `UnifiedOperationalWorkspace`; only renders high-signal sections when job or open receivable context exists.

## 10. Safe implementation strategy

- **Ownership:** all queries `userId = session.user.id`.
- **No new money movement** — links only (`OPEN_JOB`, `OPEN_INVOICE`, `OPEN_CASH_FLOW`).
- **Thresholds** documented in code comments — no opaque scoring.
- **Gating:** if user has **no jobs and no open invoices**, return minimal snapshot and skip noisy notifications.

---

### Files reviewed (representative)

`prisma/schema.prisma` (Job, Invoice, Expense, Client), `lib/jobs/**`, `lib/operational-notifications/ensure-attention.ts`, `lib/guidance/engine.ts`, `lib/cashflow/risk.ts`, `lib/income-intelligence/**`, `lib/operational-actions/**`, `app/api/jobs/**`, `app/api/invoices/**`, `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`.
