# Job Timeline & Profit UI Completion Report

## Goal

Expose normalized Job/work activity through the existing Financial Timeline and job detail pages without a second dashboard shell, analytics engine, or duplicate `FinancialEvent` storage.

## Files audited (see audit doc)

- `docs/job-timeline-profit-ui-audit.md`

## Files changed

| Area | File |
|------|------|
| Timeline query | `lib/financial-events/query.ts` — optional `jobId` filter (JOB entity **or** `metadata.jobId`) |
| Timeline API | `app/api/financial-events/timeline/route.ts` — `jobId` query param |
| Timeline UI | `components/financial-events/FinancialTimelineView.tsx` — **Jobs** type filter, job dropdown + URL `?jobId=`, job hints on rows |
| Financial timeline page | `app/(dashboard)/financial-timeline/page.tsx` — `Suspense` for `useSearchParams` |
| Job API GET | `app/api/jobs/[jobId]/route.ts` — `recomputeJobRevenue` before response (fresh rollups) |
| Job detail UI | `components/JobDetail/index.tsx` — profit explanation, timeline link, linked quote/invoice lists + links |
| Button primitive | `components/ui/button.tsx` — removed erroneous self-import (typecheck / runtime safety) |
| Typecheck gate | `tsconfig.typecheck.json` — include timeline + JobDetail paths |

## Systems reused

- `FinancialEvent` + `getFinancialTimeline` / `/api/financial-events/timeline`
- `lib/jobs/revenue.ts` via GET job (recompute on load)
- Existing dashboard layout (unchanged); `FinancialActivityWidget` unchanged
- Existing routes: `/financial-timeline`, `/jobs/[jobId]`, `/invoices/[id]`, `/quotes/edit/[id]`, `/expenses`

## APIs

- `GET /api/financial-events/timeline?jobId=<cuid>&types=...&limit=...` — job-scoped activity (lifecycle + linked records with `metadata.jobId`).

## Duplicate systems avoided

- No parallel event table or timeline API.
- No new profit/rollup module beyond existing `recomputeJobRevenue`.
- No new dashboard root or analytics service.

## Validation

- `npx tsc --noEmit -p tsconfig.typecheck.json` — passed after fixes.

## Remaining gaps

- Full-repo `npx tsc --noEmit` may still fail (historical backlog); use `npm run typecheck`.
- Expenses have no per-expense detail URL; list links to `/expenses` only.
- Timeline pagination with `cursor` + `jobId` together not exercised in UI (API supports it).
