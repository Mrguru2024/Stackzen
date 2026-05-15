# Job Normalization Completion Report

## Scope delivered

Normalized the existing `Job` nucleus with additive fields and job lifecycle events, without creating a new WorkItem table or duplicating existing financial systems.

## Files audited

- `prisma/schema.prisma`
- `app/api/jobs/route.ts`
- `app/api/jobs/[jobId]/route.ts`
- `app/api/jobs/[jobId]/deposit-invoice/route.ts`
- `app/api/jobs/[jobId]/final-invoice/route.ts`
- `lib/jobs/revenue.ts`
- `app/api/quotes/route.ts`
- `app/api/quotes/[quoteId]/convert/route.ts`
- `app/api/invoices/route.ts`
- `app/api/invoices/[invoiceId]/route.ts`
- `app/api/expenses/route.ts`
- `lib/income-profiles/activation.ts`
- `app/api/income-profiles/activation/route.ts`
- `lib/financial-events/events.ts`

## Files changed

- `docs/job-normalization-audit.md` (new)
- `docs/job-normalization-architecture.md` (new)
- `prisma/schema.prisma` (updated)
- `prisma/migrations/20260508042000_normalize_job_workitem_fields/migration.sql` (new)
- `app/api/jobs/route.ts` (updated)
- `app/api/jobs/[jobId]/route.ts` (updated)
- `app/api/jobs/[jobId]/deposit-invoice/route.ts` (updated)
- `app/api/jobs/[jobId]/final-invoice/route.ts` (updated)
- `app/api/quotes/[quoteId]/convert/route.ts` (updated, job status event parity)
- `docs/job-normalization-completion-report.md` (new)

## Schema changes

### `Job` model additions (all optional)

- `workType JobWorkType?`
- `paymentType JobPaymentType?`
- `sourceLabel String?`
- `incomeProfileType IncomeProfileType?`

### New enums

- `JobWorkType`
  - `CONTRACTOR_JOB`
  - `FREELANCE_PROJECT`
  - `GIG_SHIFT`
  - `PAYCHECK_CYCLE`
  - `SERVICE_BOOKING`
  - `SIDE_HUSTLE_TASK`
  - `OTHER`
- `JobPaymentType`
  - `INVOICE`
  - `PAYCHECK`
  - `CASH`
  - `PLATFORM_PAYOUT`
  - `DIRECT_TRANSFER`
  - `CARD`
  - `OTHER`

### FinancialEvent enum extensions

- `FinancialEventType`: `JOB_CREATED`, `JOB_UPDATED`, `JOB_STATUS_CHANGED`
- `FinancialEventSource`: `API_JOBS`

## APIs updated

- `POST /api/jobs`
  - accepts optional `workType`, `paymentType`, `sourceLabel`, `incomeProfileType`
  - emits `JOB_CREATED` event (`API_JOBS`, `relatedEntityType: JOB`)
- `PATCH /api/jobs/[jobId]`
  - accepts the same optional normalization fields
  - emits `JOB_UPDATED` or `JOB_STATUS_CHANGED` event
  - continues rollup recomputation through `lib/jobs/revenue.ts`
- `POST /api/jobs/[jobId]/deposit-invoice`
  - now emits `JOB_STATUS_CHANGED` when moving to `DEPOSIT_PENDING`
- `POST /api/jobs/[jobId]/final-invoice`
  - now emits `JOB_STATUS_CHANGED` when moving to `AWAITING_PAYMENT`
- `POST /api/quotes/[quoteId]/convert`
  - now emits `JOB_STATUS_CHANGED` when quote conversion transitions job `NEW -> QUOTED`

## Events added

- Job create event: `JOB_CREATED`
- Job generic update event: `JOB_UPDATED`
- Job status transition event: `JOB_STATUS_CHANGED`
- Source used: `API_JOBS`
- Entity used: `FinancialEntityType.JOB`

## Duplicate systems avoided

- No new WorkItem table created.
- No duplicate Job/Quote/Invoice/Expense/Income/FinancialEvent tables or APIs introduced.
- Existing `Job` relationships and `lib/jobs/revenue.ts` remain canonical for job-level rollups.
- Existing auth/session patterns (`requireAuthSession`) preserved in job endpoints.

## Validation results

- `npx prisma validate`: passed.
- `npx prisma generate`: initially blocked by Windows Prisma engine file lock (`EPERM`), succeeded after unlocking node processes and re-running.
- `npm run typecheck` (`tsc --noEmit -p tsconfig.typecheck.json`): passed. This is the narrowed production gate (Phase 1 surface + job normalization + financial-event query utilities).
- `npx tsc --noEmit` (full repository): still fails due to a large pre-existing backlog across many `app/` and other routes. Use `npm run typecheck` for CI until the global backlog is cleared. Non-production roots (`scripts/`, `server/`, `services/`, `store/`) are excluded from root `tsconfig.json` to reduce noise when running full checks.

## Remaining gaps

- Job-scoped activity is available via **`/financial-timeline?jobId=`** + **Jobs** filter in **`FinancialTimelineView`** (see `job-timeline-profit-ui-completion-report.md`).
- Status mapping is still single-enum global; work-type-specific status semantics are not yet layered.
- Income-source reconciliation (`Income` vs booking vs invoices) remains a separate normalization stream.
