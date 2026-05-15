# Financial Timeline UI Audit

## Reusable dashboard components/systems

- Existing dashboard route/layout shell is already in place:
  - `app/(dashboard)/dashboard/page.tsx`
  - `app/(dashboard)/layout.tsx`
- Existing dashboard composition component:
  - `components/dashboard/index.tsx`
  - `components/dashboard/DashboardClient.tsx`
- Existing UI primitives suitable for activity/timeline cards:
  - `components/ui/card/index.tsx`
  - `components/ui/button.tsx`
  - `components/ui/badge.tsx`
- Existing nav configuration and adaptive filtering:
  - `config/nav-links.ts` (`featureKey`)
  - `components/sidebar.tsx` (`/api/income-profiles/activation` based filtering)

## Existing activity feed logic

- Legacy dashboard activity endpoint:
  - `app/api/dashboard/activity/route.ts`
  - currently returns booking-based pseudo-transactions, not the new unified financial events.
- Unified financial timeline endpoint (new canonical API):
  - `app/api/financial-events/timeline/route.ts`
  - supports filtering by event type/source/entity and pagination controls (`limit`, `cursor`).

## Existing activity widgets

- `components/IncomeTimeline/index.tsx` exists but uses static mock data (not FinancialEvent API).
- No existing widget currently renders `FinancialEvent` timeline entries in the main dashboard.

## Duplication risks

1. Building a new dashboard shell/page wrapper would duplicate existing `app/(dashboard)/layout.tsx`.
2. Reusing `app/api/dashboard/activity/route.ts` for financial event timeline would mix incompatible activity semantics.
3. Adding a second nav configuration path would bypass activation filtering and create drift.
4. Creating fake timeline data would duplicate/compete with real `FinancialEvent` storage.

## Recommended smallest UI implementation

1. Add **one new dashboard widget component** that fetches from `/api/financial-events/timeline`.
2. Add **one new dashboard page route** under existing dashboard segment:
   - `app/(dashboard)/financial-timeline/page.tsx`
3. Use simple filter controls in-page mapped to FinancialEvent types:
   - all, invoices, quotes, expenses, income profiles
4. Add one nav link in existing `config/nav-links.ts` with `featureKey`, and include this key in activation nav key sets.
5. Keep all rendering inside existing card/button patterns and existing dashboard layout system.
