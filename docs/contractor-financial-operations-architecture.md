# Contractor financial operations — architecture

Deterministic **operational** contractor/hybrid layer: project-linked **cash**, **deposits**, **receivables**, and **recorded** profitability — not generic ERP, not disconnected dashboards.

## Data sources (canonical)

1. **`Job`** — fields maintained by `recomputeJobRevenue` (`jobRevenue`, `jobExpenses`, `estimatedProfit`, `depositPaid`, `depositStatus`, …).
2. **`Invoice`** — open receivables (`status` not `paid`/`failed`), `dueDate`, `amount`, `clientId`, `jobId`.
3. **`Expense`** — `jobId`-linked spend for job P&L.
4. **`buildCashFlowForecast`** — risk codes for reserve/timing copy in nudges (reuse, no duplicate forecast engine).

## 1. Job cash flow intelligence (snapshot)

Expose per job (recent N):

- **Expected revenue** — interpret as `estimatedAmount` when set, else trailing paid `jobRevenue` (documented in explain).
- **Material exposure** — flag when `jobExpenses > depositPaid` while deposit policy is not satisfied (`depositStatus` not `PAID` / `WAIVED` / `NOT_REQUIRED`): cash out on the job exceeds deposit collected.
- **Deposit coverage** — `depositPaid` vs `getRequiredDepositAmount` policy (read-only display; deposit enforcement remains existing job/invoice flows).
- **Projected profitability** — `estimatedProfit` from ledger-backed recompute (not a new formula).
- **Payout / collection timing** — link to open invoices’ `dueDate` and existing `invoice_overdue` operational rows (no duplicate per-invoice engine).

## 2. Material exposure protection (alerts)

Single upserted notification `contractor_ops_material_exposure` when ≥1 qualifying job; body lists top jobs by `(jobExpenses - depositPaid)`; **mark read** when none qualify.

## 3. Contractor reserve intelligence (snapshot text)

Deterministic **nudges** only:

- If forecast includes `PROJECTED_LOW_BALANCE` or `ALLOCATION_PRESSURE` **and** contractor snapshot has material exposure or negative margin jobs → reference emergency goal / cash flow (same guidance patterns as today).
- **`TAX_RESERVE_SUGGESTED`** — when the user has jobs, no active `OperationalGoal` with `goalKind === TAX_RESERVE`, and either late-payer client groups exist on open AR or forecast includes `INVOICE_RECEIVABLE_GAP` → nudge to create an auditable tax reserve goal (SmartAllocation stays tied to goals).

No standalone “tax score.”

## 4. Invoice collection intelligence

- **Aging** — for open invoices: days past `dueDate` (deterministic).
- **Concentration** — HHI on **open** invoice amounts grouped by `clientId` (same pattern as income concentration on inflows).
- **Late payers** — `summarizeLatePayersByClient`: only invoices with `daysPastDue > 0`, grouped by `clientId`; amount-weighted average lateness (no ML).
- **Near-term timing drift** — `summarizeUpcomingDueSpread`: for unpaid invoices with `dueDate` in `(today, today+windowDays]`, mean and population stdev of calendar days-until-due (staggered vs clustered inflows).
- **Alert** `contractor_ops_receivable_concentration` when HHI ≥ threshold and ≥2 open invoices (portfolio-level; line-level overdue remains `invoice_overdue`).

## 5. Operational actions

v1 uses **existing** client actions only (`OPEN_JOB`, `OPEN_INVOICE`, `OPEN_CASH_FLOW`, `OPEN_CLIENT`) inside notification metadata — user executes in existing surfaces. No autonomous billing.

## 6. Explainability

- `metadata.trust` + `metadata.contractorOps` payload: job ids, invoice ids, formulas referenced (`recomputeJobRevenue`, deposit policy), HHI definition.

## API

- `GET /api/operational-center/contractor-operations?ensure=true|false` — returns snapshot JSON; when `ensure`, runs `ensureContractorOperationalAttentionNotifications`.

## Workspace

- `ContractorFinancialOperationsPanel` — shows snapshot sections; hidden/minimal when no job and no open receivable context.

## UI domain

- `contractor_ops_*` attention kinds map to **`work`** in `inferDomain` (job-led operational money).
