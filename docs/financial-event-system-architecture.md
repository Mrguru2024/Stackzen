# Financial Event System Architecture

## Schema design

Add a dedicated Prisma model:

- `FinancialEvent`
  - `id`
  - `userId`
  - `type`
  - `source`
  - `amount` (optional)
  - `currency` (default `USD`)
  - `metadata` (JSON, optional)
  - `relatedEntityType` (optional)
  - `relatedEntityId` (optional)
  - `createdAt`
  - `updatedAt`

Recommended enums:

- `FinancialEventType`
  - invoice/quote/expense/profile lifecycle events
- `FinancialEventSource`
  - API surface where event originated
- `FinancialEntityType`
  - `INVOICE`, `QUOTE`, `EXPENSE`, `INCOME_PROFILE`, `JOB`, etc.

This keeps event payload lightweight and reference-first.

## Event generation strategy

- Emit events only from canonical mutation handlers:
  - invoices
  - quotes
  - expenses
  - income profile onboarding updates
- Event utility in `lib/financial-events`:
  - validates payload shape
  - writes Prisma row
  - safe mode helper for non-blocking emits in MVP
- Use consistent reference fields:
  - `relatedEntityType` + `relatedEntityId`
  - `metadata` for non-critical contextual hints

## AI usage strategy

- AI APIs consume recent financial events (bounded window) as contextual facts.
- Combine event tags with existing income profile activation tags.
- Avoid full domain joins in AI prompt layer; query timeline utility once.

## Notification usage strategy

- Financial events become the trigger substrate for future notification rules:
  - overdue risk
  - paid invoice confirmations
  - quote follow-up reminders
  - unusual expense behavior
- Notification engine should read event stream and apply rule-based filtering, not duplicate domain listeners.

## Dashboard usage strategy

- Use timeline API as source for:
  - unified activity feed
  - recent financial actions widget
  - event-derived counters (future)
- Keep existing dashboard summary APIs for aggregates; timeline API for chronology.

## Anti-duplication strategy

- Domain models remain source-of-truth for business data.
- `FinancialEvent` is source-of-truth for cross-domain chronology only.
- No duplicate transaction tables or per-widget event logs.
- One event mapping layer in `lib` shared by API consumers.

## Scalability assessment

- Append-friendly event model with indexed `userId + createdAt`.
- Supports hybrid income users naturally because event stream is entity-agnostic.
- JSON metadata allows additive evolution without immediate schema churn.
- Suitable for future analytics/event pipelines and behavioral scoring with minimal migration overhead.
