# Phase 2 Contractor Engine Audit

## Existing reusable models (Prisma)

- `User` (ownership root for business data)
- `Client` (customer record)
- `Service` (catalog/service offering)
- `Quote` (minimal: title/content/status/user)
- `Invoice` + `LineItem` (billing and line-level pricing)
- `Expense` (operational cost tracking)

These are the correct foundational entities for a contractor/service-business workflow and should be reused.

## Existing quote system

- Route: `app/api/quotes/route.ts` (`GET`, `POST`)
- Route: `app/api/quotes/[quoteId]/convert/route.ts` (`POST`)
- Current quote payload in schema is minimal (`title`, `content`, `status`, `userId`)
- Conversion route already creates an invoice and links `invoice.quoteId`

## Existing invoice system

- Primary routes:
  - `app/api/invoices/route.ts`
  - `app/api/invoices/[invoiceId]/route.ts`
- Additional overlapping legacy route:
  - `app/api/invoices/[invoiceId]/[id]/route.ts`
- Payment routes:
  - `app/api/invoices/create-payment-intent/route.ts`
  - `app/api/invoices/[invoiceId]/create-payment-intent/route.ts`
  - `app/api/invoices/[invoiceId]/[id]/pay/route.ts`
  - `app/api/invoices/verify-payment/route.ts`
  - webhook: `app/api/webhooks/stripe/route.ts`

## Existing client/service models

- `Client` currently linked to `Invoice`
- `Service` currently linked to `Booking` and `User`
- No central job/work-order entity currently connecting client + quote + invoice + expenses + work lifecycle

## Existing Stripe/payment flow

- Stripe Checkout and PaymentIntent creation are implemented.
- Webhook handles signature verification and idempotency via `StripeEvent`.
- Metadata already includes `invoiceId` and user linkage, and quote metadata has been introduced where available.

## Existing expense tracking

- Route: `app/api/expenses/route.ts` (`GET`, `POST`, `PATCH`, `DELETE`)
- Uses Prisma + authenticated session ownership checks + Zod schema
- Expenses are currently user-level only (not tied to quote/invoice/job)

## Missing relationships for contractor revenue engine

1. No canonical `Job` model as the source-of-truth lifecycle entity.
2. `Quote`, `Invoice`, and `Expense` are not all connected to one central job.
3. No explicit deposit/balance contract workflow on top of invoices.
4. No first-class job-level profit aggregation (revenue minus expenses).
5. Duplicate invoice API surfaces (`[invoiceId]/route.ts` and `[invoiceId]/[id]/route.ts`) create source-of-truth ambiguity.

## Existing duplicate systems

- Invoice mutation/read logic exists in multiple route variants with overlapping responsibilities.
- Payment creation exists in both nested and non-nested invoice routes.
- Contractor flow should standardize around one canonical path per concern.

## Source of truth recommendation

- **Job** should become the central source of truth for contractor lifecycle:
  - `Client -> Job -> Quote -> Deposit Invoice -> Work -> Final Invoice -> Payment -> Profit`
- Keep using existing `Quote`, `Invoice`, `Expense`, `Client`, `Service` models by linking them to `Job` rather than replacing them.
- Keep webhook-driven Stripe payment status as source of truth for payment finalization.
