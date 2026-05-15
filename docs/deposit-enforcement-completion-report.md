# Deposit Enforcement MVP — Completion Report

## Summary

Job-level **conditional** deposit policy and status are implemented. Jobs default to **no deposit required**; enforcement applies only when **`depositRequired`** is true. **`IN_PROGRESS`** is blocked only in that case until deposit is **PAID** or **WAIVED** (partial pay does not unlock work start).

## Files audited

See `docs/deposit-enforcement-audit.md`.

## Schema changes

- Enums: `JobDepositType` (`NONE`, `PERCENTAGE`, `FIXED_AMOUNT`), `JobDepositStatus` (`NOT_REQUIRED`, `REQUIRED_UNPAID`, `PARTIALLY_PAID`, `PAID`, `WAIVED`).
- `Job` fields: `depositRequired`, `depositType`, `depositFixedAmount`, `depositWaived`, `depositStatus` (plus existing `depositPercentage`, `depositPaid`).
- `FinancialEventType`: `DEPOSIT_POLICY_UPDATED`, `JOB_DEPOSIT_PAID`, `JOB_DEPOSIT_WAIVED`.
- Migration: `prisma/migrations/20260508100000_deposit_enforcement_mvp/migration.sql`.

## Files changed / added

| Item | Path |
|------|------|
| Audit | `docs/deposit-enforcement-audit.md` |
| Policy + resolver | `lib/jobs/deposit-status.ts` |
| Rollup + status + event | `lib/jobs/revenue.ts` |
| Create job policy | `app/api/jobs/route.ts` |
| Guard + policy events | `app/api/jobs/[jobId]/route.ts` |
| Conditional deposit invoice | `app/api/jobs/[jobId]/deposit-invoice/route.ts` |
| Job detail UI | `components/JobDetail/index.tsx` |
| Timeline filters | `components/financial-events/FinancialTimelineView.tsx` |
| Prisma schema | `prisma/schema.prisma` |
| Typecheck includes | `tsconfig.typecheck.json` |

## APIs

- **`POST /api/jobs`** — optional `depositRequired`, `depositType`, `depositPercentage`, `depositFixedAmount`; then `recomputeJobRevenue` seeds `depositStatus`.
- **`PATCH /api/jobs/[jobId]`** — same fields + `depositWaived`. **`IN_PROGRESS`** → **409** if `depositRequired && !depositWaived && depositStatus` is not PAID/WAIVED (after live `recomputeJobRevenue`). Emits `DEPOSIT_POLICY_UPDATED` / `JOB_DEPOSIT_WAIVED` when applicable.
- **`POST .../deposit-invoice`** — requires **`depositRequired`**, valid **`depositType`** (not `NONE`); uses **percentage** or **fixed** amount from job policy.
- **`GET /api/jobs/[jobId]`** — unchanged flow; `recomputeJobRevenue` refreshes `depositStatus`.

## Calculations (single source)

- **`lib/jobs/revenue.ts`** continues to aggregate paid invoices and expenses; calls **`resolveDepositStatus`** from **`lib/jobs/deposit-status.ts`** using paid **deposit** invoice totals vs required amount from policy.
- **`JOB_DEPOSIT_PAID`** emitted when rollup transitions into **`PAID`** for a deposit-required job.

## Duplication avoided

- No second billing engine; final invoice route still subtracts **paid** deposit totals.
- No duplicate event store; only new **`FinancialEventType`** values and existing **`API_JOBS`** source.

## Validation

- `npx prisma validate` — passed  
- `npx prisma generate` — passed  
- `npm run typecheck` — passed (`tsconfig.typecheck.json`)

## Remaining gaps

- **Deposit policy UI** — **done:** `components/JobDetail/index.tsx` includes **Edit deposit policy** (switch, type, amounts, waive) → **`PATCH /api/jobs/[jobId]`**.
- Stripe webhook still overwrites **`Job.status`** from invoice counts; deposit guard affects **`IN_PROGRESS`** transitions only.
- **`PARTIALLY_PAID`** does not allow **In progress** (by design per spec).

## Production notes

Run migrations: `npx prisma migrate deploy` (or `migrate dev`) so new columns and enum values exist before deploy.
