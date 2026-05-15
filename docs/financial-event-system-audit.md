# Financial Event System Audit

## Reusable systems

- **Canonical persistence + domain models**
  - Prisma schema in `prisma/schema.prisma`
  - Existing financial entities: `Invoice`, `Quote`, `Expense`, `Income`, `FinancialGoal`, `Gig`, `GigApplication`, `UserIncomeProfile`, `Job`
- **Event-like persisted systems already present**
  - `AuditLog` (admin/security operational events)
  - `ErrorLog` (error events)
  - `StripeEvent` (webhook idempotency events)
  - `CardTransaction` + `SavingsExecution` (domain-specific transaction-like histories)
- **Canonical mutation APIs that should emit financial events**
  - `app/api/invoices/route.ts`
  - `app/api/invoices/[invoiceId]/route.ts`
  - `app/api/quotes/route.ts`
  - `app/api/quotes/[quoteId]/convert/route.ts`
  - `app/api/expenses/route.ts`
  - `app/api/income-profiles/route.ts`
- **Adaptive architecture already in place**
  - `lib/income-profiles/activation.ts`
  - `app/api/income-profiles/activation/route.ts`
  - sidebar adaptation in `components/sidebar.tsx`

## Conflicting systems

- **Duplicate route variants**
  - `app/api/invoices/route.ts` and `app/api/invoices/route-cached.ts`
  - `app/api/expenses/route.ts` and `app/api/expenses/route-cached.ts`
- **Income source inconsistency**
  - some income APIs derive from bookings/services
  - others read `Income` model directly
- **Notification/event table drift**
  - code references `Notification`, `Reminder`, and some security/audit tables not consistently represented in current Prisma schema
- **Parallel legacy integrations**
  - Prisma canonical stack coexists with legacy Supabase/Drizzle-adjacent code in parts of analytics/security flows

## Duplication risks

1. Building a second “transaction/event log” per feature area would fragment timeline and analytics.
2. Reusing `AuditLog` as financial timeline would mix admin/security operations with financial domain events.
3. Deriving timeline independently in each dashboard widget would duplicate mapping logic and drift.
4. Building event payload stores that duplicate full invoice/expense records would increase data inconsistency risk.

## Recommended source of truth

- Add a dedicated Prisma `FinancialEvent` model as canonical **cross-domain financial activity stream**.
- Keep existing domain models (`Invoice`, `Quote`, `Expense`, `Income`, `UserIncomeProfile`) as source-of-record.
- `FinancialEvent` should store references + compact metadata only, not duplicate full domain entities.

## Event architecture recommendation

- **Producer pattern**
  - Emit events from canonical mutation endpoints only.
- **Centralized utilities**
  - One event write utility (`createFinancialEvent`) in `lib`.
  - One query/timeline utility for API consumers.
- **MVP producers**
  - invoice create/update/status-related flows
  - quote create/convert
  - expense create/update/delete
  - onboarding income profile updates
- **MVP consumer**
  - timeline API returning normalized event stream for future dashboard/activity/AI/notification consumers.
