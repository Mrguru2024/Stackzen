# Universal WorkItem Audit

## Scope

Audit of existing work/job/project/income structures completed before any WorkItem implementation.

## Existing structures (current state)

### Canonical work and revenue entities

- `Job` is the closest current work unit.
- `Job` connects to:
  - `Client`
  - `Quote` (optional by `jobId`)
  - `Invoice` (optional by `jobId`)
  - `Expense` (optional by `jobId`)
- `Job` already stores rollup-like fields (`jobRevenue`, `jobExpenses`, `estimatedProfit`, `depositPaid`, `remainingBalance`).
- `Project` model does not exist in current Prisma schema.

### Income structures (fragmented)

- `Income` model exists as user-scoped ledger rows (`date`, `amount`, `source`, `notes`).
- Booking-based income flow also exists through `Service` + `Booking`.
- Some income APIs aggregate bookings/services instead of the `Income` table.

### Event layer

- `FinancialEvent` is the centralized activity timeline.
- Timeline API: `app/api/financial-events/timeline/route.ts`.
- Enum includes `FinancialEntityType.JOB`, but observed event emission is currently strongest around quotes/invoices/expenses/income-profile updates.

### Activation / feature gating

- `UserIncomeProfile` + `resolveIncomeProfileActivation` controls nav/workflows/widgets/features.
- Sidebar uses activation API to filter links by `featureKey`.

## Existing source-of-truth flows

1. Client + job lifecycle is managed in jobs APIs.
2. Quotes can convert to invoices (`quotes/[quoteId]/convert`).
3. Invoices and expenses can trigger job revenue recomputation.
4. `lib/jobs/revenue.ts` is current central profit rollup utility for job-scoped financials.
5. Financial timeline is read from `FinancialEvent`, not from ad hoc UI-only activity tables.

## Reusable components/utilities for WorkItem

- Data model base: existing `Job` schema/relations.
- Revenue rollup utility: `lib/jobs/revenue.ts`.
- Event ingestion and querying:
  - `lib/financial-events/events.ts`
  - `lib/financial-events/query.ts`
- Existing timeline UI:
  - `components/financial-events/FinancialActivityWidget.tsx`
  - `components/financial-events/FinancialTimelineView.tsx`
- Dashboard shell and nav activation are already reusable and should not be rebuilt.

## Duplication and conflict risks

1. Creating a separate WorkItem table without reusing/extending `Job` would duplicate core work graph logic.
2. Mixing three income truths (`Income`, bookings, paid invoices) can produce contradictory analytics.
3. Building new event streams outside `FinancialEvent` would fracture timeline consistency.
4. Rebuilding dashboard shells/cards would duplicate existing App Router dashboard architecture.
5. Implementing a single mega-WorkItem that merges jobs, marketplace gigs, and bookings in one step risks schema and workflow drift.

## Recommended canonical direction

- Treat `Job` as the primary existing WorkItem-equivalent and evolve from it.
- Keep `FinancialEvent` as chronological activity source.
- Keep Prisma models and NextAuth auth/session patterns unchanged as foundational constraints.
- Define explicit income-source semantics before broad WorkItem analytics (job invoice income vs booking income vs direct income entries).

## Safe implementation path (future)

1. Normalize semantics first (document what "income", "work", and "profit" each API means).
2. Ensure event completeness across all work-related flows.
3. Extend `Job` toward universal WorkItem behavior instead of introducing a disconnected parallel platform.
4. Reuse existing dashboards, card primitives, and activation architecture.
5. Introduce adapter-level aggregation utilities before schema-heavy changes.

## High-priority files for future WorkItem implementation

- `prisma/schema.prisma`
- `lib/jobs/revenue.ts`
- `lib/financial-events/events.ts`
- `lib/financial-events/query.ts`
- `app/api/jobs/**`
- `app/api/quotes/**`
- `app/api/invoices/**`
- `app/api/expenses/**`
- `app/api/income/**`
- `app/api/financial-events/timeline/route.ts`
- `lib/income-profiles/activation.ts`
- `app/api/income-profiles/**`
- `components/sidebar.tsx`
- `config/nav-links.ts`

## Audit conclusion

The existing architecture already has a practical WorkItem nucleus (`Job` + linked financial records + centralized event timeline). The safest path is an incremental extension of this nucleus, not a fresh universal platform.
