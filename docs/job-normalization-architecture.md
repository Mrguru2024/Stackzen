# Job Normalization Architecture (MVP)

## Goal

Normalize existing `Job` into a flexible earning-activity nucleus without creating a new WorkItem table or parallel platform.

## Recommended schema changes (minimal)

Add optional fields to `Job`:

- `workType JobWorkType?`
- `paymentType JobPaymentType?`
- `sourceLabel String?`
- `incomeProfileType IncomeProfileType?`

Add enums:

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

Extend FinancialEvent enums for job mutations:

- `FinancialEventType`
  - `JOB_CREATED`
  - `JOB_UPDATED`
  - `JOB_STATUS_CHANGED`
- `FinancialEventSource`
  - `API_JOBS`

No new table introduced.

## API update plan

Update only:

- `app/api/jobs/route.ts` (POST schema + event on create)
- `app/api/jobs/[jobId]/route.ts` (PATCH schema + event on update/status change)

Behavior:

- Continue validating ownership via `requireAuthSession` and `userId`.
- Keep existing client/service/assigned tech validations.
- Accept new optional normalization fields in create/patch payloads.
- Preserve backward compatibility by keeping fields optional.

## Event emission strategy

Use `createFinancialEventSafe` in job mutation routes:

- Create:
  - type: `JOB_CREATED`
  - source: `API_JOBS`
  - entity: `JOB`
- Patch:
  - type: `JOB_STATUS_CHANGED` when status changed
  - otherwise `JOB_UPDATED`
  - source: `API_JOBS`
  - entity: `JOB`

Metadata should include:

- `jobId`, `title`, `status`
- `workType`, `paymentType`, `sourceLabel`, `incomeProfileType`
- `previousStatus` for status changes

## Profit rollup impact

- Keep `lib/jobs/revenue.ts` unchanged as canonical rollup engine.
- New normalization fields are descriptive dimensions only (non-breaking for financial math).
- Existing quote/invoice/expense links continue driving revenue/expense/profit.

## Dashboard/timeline impact

- No dashboard shell rebuild.
- Timeline gains job lifecycle visibility through new job events.
- Existing `FinancialTimelineView` and widget can display new job events automatically if they render event type/source strings.

## Activation impact

- No required changes to activation structure.
- Optional `incomeProfileType` on Job provides a future bridge to profile-aware filtering without changing current activation contracts.

## Migration safety notes

1. All new `Job` fields are nullable to avoid backfill risk.
2. Enum additions are additive only.
3. Event enum additions are additive only.
4. Existing APIs remain valid with unchanged payloads.
5. No changes to quote/invoice/expense schema relationships.
