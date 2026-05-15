# Job Normalization Audit

## Existing Job implementation

### Current Job fields (`prisma/schema.prisma`)

- Identity/ownership: `id`, `userId`
- Relationships: `clientId`, optional `serviceId`
- Core payload: `title`, `description`
- Lifecycle: `status` (`JobStatus`)
- Financial rollup fields:
  - `estimatedAmount`
  - `depositPercentage`
  - `depositPaid`
  - `remainingBalance`
  - `jobRevenue`
  - `jobExpenses`
  - `estimatedProfit`
- Timing: `startDate`, `endDate`, `completedAt`
- Timestamps: `createdAt`, `updatedAt`
- Relations:
  - `client`, `service`
  - `quotes[]`, `invoices[]`, `expenses[]`
  - `assignedTechs[]`

### Current Job statuses

- `NEW`
- `QUOTED`
- `APPROVED`
- `DEPOSIT_PENDING`
- `IN_PROGRESS`
- `AWAITING_PAYMENT`
- `PAID`
- `COMPLETED`
- `CLOSED`

### Current API surface (`app/api/jobs/**`)

- `GET /api/jobs`: user-scoped job list with client/service/quotes/invoices.
- `POST /api/jobs`: creates job with session ownership and optional assignments.
- `GET /api/jobs/[jobId]`: user-scoped single job details.
- `PATCH /api/jobs/[jobId]`: updates selected fields and recomputes job rollups.
- `POST /api/jobs/[jobId]/deposit-invoice`: creates deposit invoice + updates job status.
- `POST /api/jobs/[jobId]/final-invoice`: creates final invoice + updates job status and balances.

## Existing rollup behavior (`lib/jobs/revenue.ts`)

- `recomputeJobRevenue(jobId, userId)` is the central rollup utility.
- Revenue basis: **paid invoices only** (`status === 'paid'`).
- Expense basis: all expenses linked to `jobId`.
- Derivations:
  - `jobRevenue = sum(paid invoices)`
  - `depositPaid = sum(paid deposit invoices)`
  - `jobExpenses = sum(job expenses)`
  - `remainingBalance = max(contractValue - depositPaid, 0)` where `contractValue = estimatedAmount ?? jobRevenue`
  - `estimatedProfit = jobRevenue - jobExpenses`

## Existing quote/invoice/expense links to Job

- `Quote.jobId` optional, validated against session user on creation.
- Quote conversion creates `Invoice` with `jobId` and may set job status (`NEW -> QUOTED`).
- `Invoice.jobId` optional, validated in invoice create route.
- Invoice updates recompute job revenue when linked to a job.
- `Expense.jobId` optional, validated and recomputed on create/update/delete.

## FinancialEvent coverage related to jobs

- Financial events exist for:
  - quotes (`QUOTE_CREATED`, `QUOTE_CONVERTED`)
  - invoices (`INVOICE_CREATED`, `INVOICE_UPDATED`, `INVOICE_STATUS_CHANGED`)
  - expenses (`EXPENSE_CREATED`, `EXPENSE_UPDATED`, `EXPENSE_DELETED`)
  - income profile updates (`INCOME_PROFILE_UPDATED`)
- `FinancialEntityType` includes `JOB`, but **job mutations do not emit job events currently**.
- Deposit/final invoice job endpoints currently do not emit dedicated FinancialEvent records.

## Income-profile activation alignment

- Activation features already include `jobs`, `quotes`, `invoices`, `deposits`, `profit.tracking`.
- Profiles:
  - contractor/freelance/business are job-centric in workflows.
  - gig/paycheck/side-hustle rely on other flows, but Job currently lacks explicit work categorization fields.

## Gaps preventing Job from representing multiple work types

1. No explicit activity classification (`workType`) on `Job`.
2. No payment-channel classification (`paymentType`) on `Job`.
3. No source descriptor (`sourceLabel`) for platform/employer/customer origin.
4. No explicit profile alignment marker on `Job` (e.g., `incomeProfileType`).
5. No job-level FinancialEvent emissions for create/update/status transitions.
6. Current status set is contractor-oriented and not tagged by work mode.

## Duplication risks

1. Creating a separate WorkItem table would duplicate existing job+links+rollup behavior.
2. Building another rollup utility outside `lib/jobs/revenue.ts` would split profit truth.
3. Adding a second event stream for jobs would duplicate FinancialEvent purpose.
4. Rebuilding workflow-specific APIs for gig/paycheck work instead of extending Job minimally would fragment ownership and reporting.

## Recommended safe changes (minimal)

1. Extend `Job` (do not replace it) with nullable metadata fields:
   - `workType` enum
   - `paymentType` enum
   - `sourceLabel` string
   - `incomeProfileType` enum
2. Keep current status enum and financial rollup logic unchanged.
3. Update jobs create/patch validation to accept new optional fields.
4. Emit FinancialEvent for:
   - job created
   - job updated
   - job status changed
5. Reuse session ownership via `requireAuthSession` for all new mutation paths.
