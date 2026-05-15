# Phase 2 Contractor Engine Completion Report

Date: 2026-05-07

## Models added

- `Job` (new central lifecycle entity)
  - ownership: `userId`
  - customer: `clientId`
  - optional service linkage: `serviceId`
  - lifecycle status: `JobStatus` enum
  - contract/deposit/profit fields:
    - `estimatedAmount`
    - `depositPercentage`
    - `depositPaid`
    - `remainingBalance`
    - `jobRevenue`
    - `jobExpenses`
    - `estimatedProfit`
  - optional timeline fields (`startDate`, `endDate`, `completedAt`)

## Relationships added

- `Quote.jobId -> Job.id` (optional)
- `Invoice.jobId -> Job.id` (optional)
- `Expense.jobId -> Job.id` (optional)
- `Job -> Client` (required)
- `Job -> Service` (optional)
- `Job <-> User` assigned tech relation (`JobAssignments` many-to-many)
- `Invoice.invoiceType` for `standard | deposit | final` workflow segmentation

Migration added:

- `prisma/migrations/20260508003000_add_job_contractor_engine/migration.sql`

## Existing systems reused

- Reused existing entities as requested:
  - `Client`
  - `Service`
  - `Quote`
  - `Invoice`/`LineItem`
  - `Expense`
- Reused Stripe payment infrastructure:
  - invoice payment-intent/checkout routes
  - webhook idempotency + status handling
- Reused session ownership pattern via `requireAuthSession` and `getServerSession`.

## API/flow implementation completed

### 1) Job-centric architecture

Added:

- `GET/POST /api/jobs`
- `GET/PATCH /api/jobs/[jobId]`

### 2) Core system connections

- Quotes now support optional `jobId` with ownership validation.
- Quote conversion route links converted invoices to both `quoteId` and `jobId` (when available).
- Invoices support optional `jobId`, `invoiceType`, `cost`, `profit`.
- Expenses support optional `jobId` with ownership validation.
- Stripe metadata now carries `jobId` + `invoiceId` (+ `quoteId` when available).

### 3) Deposit system

Added:

- `POST /api/jobs/[jobId]/deposit-invoice`
  - percentage-driven deposit invoice generation
  - sets job status to `DEPOSIT_PENDING`
  - tracks remaining balance

- `POST /api/jobs/[jobId]/final-invoice`
  - computes paid deposits from paid deposit invoices
  - creates final invoice for remaining amount
  - updates job status to `AWAITING_PAYMENT`

### 4) Basic profit tracking

Added revenue sync helper:

- `lib/jobs/revenue.ts` (`recomputeJobRevenue`)

This updates job-level:

- `jobRevenue` from paid invoices
- `jobExpenses` from linked expenses
- `depositPaid` from paid deposit invoices
- `remainingBalance`
- `estimatedProfit`

## Validation results (requested)

- `npx prisma validate` -> **PASS**
- `npx tsc --noEmit` -> **FAIL** (large pre-existing repository-wide TypeScript backlog not specific to contractor engine changes)

## Remaining gaps

1. Legacy duplicate invoice route surfaces still exist and should be normalized to one canonical invoice API surface.
2. Full UI wiring is still needed:
   - job creation/edit screens
   - quote-to-job association UX
   - deposit/final invoice actions in UI
   - job status transition controls
3. Some existing global TypeScript debt remains outside this phase scope.

## Is contractor flow functional end-to-end?

**Backend contractor flow is functionally connected end-to-end** for:

- Client -> Job -> Quote -> Deposit Invoice -> Final Invoice -> Stripe Metadata -> Payment Status -> Job Profit updates

UI orchestration is still pending, so end-to-end is currently API-functional, not full product-UX complete.
