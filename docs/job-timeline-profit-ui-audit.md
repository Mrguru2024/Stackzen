# Job Timeline & Profit UI Audit

## Scope

Audit completed before implementation. Goal: expose normalized Job/work activity via existing Financial Timeline and job surfaces without duplicating dashboard shells or the `FinancialEvent` system.

## `app/api/jobs/**`

| Route | Role |
|-------|------|
| `GET/POST /api/jobs` | List/create jobs; creates emit `JOB_CREATED`. |
| `GET/PATCH /api/jobs/[jobId]` | Single job with quotes, invoices, expenses; PATCH emits job events and calls `recomputeJobRevenue`. |
| `POST .../deposit-invoice`, `POST .../final-invoice` | Create invoices + update job status; emit `JOB_STATUS_CHANGED`. |

**Gap:** `GET /api/jobs/[jobId]` returns rollup fields (`jobRevenue`, `jobExpenses`, `estimatedProfit`) from the database but does **not** call `recomputeJobRevenue` before respond, so UI may show stale rollups until another mutation triggers recompute.

## `lib/jobs/revenue.ts`

- `recomputeJobRevenue(jobId, userId)` is the **only** centralized job P&L rollup (paid invoices + job expenses → stored job fields).
- Safe to invoke on read for a **fresh snapshot** when scope stays this single job.

## FinancialEvent timeline API

- File: `app/api/financial-events/timeline/route.ts`
- Query params: `limit`, `cursor`, `relatedEntityType`, `types`, `sources`.
- **Gap:** No `relatedEntityId` or **`jobId`** filter. Events that belong to a job often store `jobId` inside `metadata` (invoices, quotes, expenses) or use `relatedEntityType: JOB` + `relatedEntityId` for job lifecycle events. Without server-side `jobId` filtering, the UI cannot show “this job only” without client-side filtering (incorrect pagination) or duplicating queries.

## `lib/financial-events/query.ts`

- Builds Prisma `where` for `userId`, optional `type`, `source`, `relatedEntityType` only.
- **Extension needed:** Optional `jobId` (and/or `relatedEntityId` paired with type) for scoped timelines.

## Financial Timeline UI (`components/financial-events/FinancialTimelineView.tsx`)

- Filter chips: All, Invoices, Quotes, Expenses, Income Profiles (maps to `FinancialEventType` groups).
- **Gap:** No “Jobs” chip for `JOB_CREATED` / `JOB_UPDATED` / `JOB_STATUS_CHANGED`.
- **Gap:** No way to narrow to **one job** (need API `jobId` + optional job picker or `?jobId=` from URL).

## Dashboard widgets

- `FinancialActivityWidget` uses `/api/financial-events/timeline?limit=6` (global feed).
- No duplicate timeline system; reuse only.

## Job routes / pages

- `app/(dashboard)/jobs/page.tsx` → `JobsHub`.
- `app/(dashboard)/jobs/[jobId]/page.tsx` → `components/JobDetail`.
- **JobDetail** already shows revenue, expenses, estimated profit, and counts for quotes/invoices/expenses.
- **Gaps:** Rollups not refreshed on load; linked records are counts only—no short lists/links to invoices/quotes/expenses; no link to Financial Timeline scoped to this job.

## Duplication risks

- Building a second “activity” API or client-only job event list would duplicate `FinancialEvent`.
- Adding a new profit engine would duplicate `recomputeJobRevenue` / stored job fields.

## Recommended minimal approach

1. Extend `getFinancialTimeline` + timeline route with optional **`jobId`** (OR: `relatedEntityType=JOB` + `relatedEntityId`, **or** `metadata.jobId` match).
2. Add UI: “Jobs” type filter + optional job selector + support `?jobId=` on `/financial-timeline`.
3. On `GET /api/jobs/[jobId]`, call `recomputeJobRevenue` then return job (fresh profit summary using existing utility).
4. Enrich JobDetail with compact linked-record rows + link “View activity” → `/financial-timeline?jobId=...`.

## MVP scope (this pass)

- Server: timeline `jobId` query + GET job recompute.
- UI: timeline Jobs filter + job scope + JobDetail links and refreshed metrics.
- No new analytics service, no duplicate event tables.
