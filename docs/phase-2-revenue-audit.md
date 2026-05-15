# Phase 2 Revenue Audit

## Current Quote structure (Prisma)

`Quote` currently contains:

- `id`
- `userId`
- `title`
- `content`
- `status` (default `"draft"`)
- timestamps

Current API behavior (`app/api/quotes/route.ts`):

- Supports only minimal payload (`title`, `content`, optional `status`)
- Explicitly rejects extended commercial fields (client, items, tier, etc.) with 501

## Current Invoice structure (Prisma)

`Invoice` currently contains:

- `id`, `number`
- `clientId`, `userId`
- `dueDate`
- `amount`
- `status` (string, default `"pending"`)
- `notes`, `jobTag`
- relation to `Client`, `User`, `LineItem[]`
- timestamps and indexes

There is no `quoteId`, `cost`, or `profit` field at this time.

## Existing Quote <-> Invoice relationship

- **No direct relation exists** in schema.
- No API endpoint currently converts a quote into an invoice.

## Existing payment flow wiring

Relevant routes found:

- `app/api/invoices/create-payment-intent/route.ts` (Checkout Session creation)
- `app/api/invoices/[invoiceId]/create-payment-intent/route.ts` (PaymentIntent creation)
- `app/api/invoices/verify-payment/route.ts` (retrieves Stripe status, currently read-oriented)
- `app/api/webhooks/stripe/route.ts` (webhook source-of-truth status updates)
- `app/api/invoices/[invoiceId]/[id]/pay/route.ts` (legacy pay route)

Current status updates:

- Webhook marks paid on success events.
- Webhook marks `"overdue"` on `payment_intent.payment_failed`.
- Verify-payment route currently does not guarantee paid/failed persistence by itself.

## Missing links to complete revenue flow

1. Quote -> Invoice conversion endpoint does not exist.
2. Invoice has no `quoteId` linkage.
3. Invoice payment status set does not align to required set (`draft`, `pending`, `paid`, `failed`).
4. Stripe metadata does not consistently include `quoteId`.
5. No first-class invoice `cost` / `profit` fields for basic margin tracking.

## What is needed to connect the flow

1. Add conversion route: `POST /api/quotes/[quoteId]/convert`
   - Auth + ownership checks
   - Build invoice from quote data
   - Link invoice to quote
   - Initialize status as `pending`
2. Extend `Invoice` model minimally:
   - optional `quoteId` relation
   - optional `cost` and `profit`
3. Update payment status logic:
   - verify-payment should persist `paid` or `failed`
   - webhook failure should use `failed` fallback
4. Ensure metadata consistency:
   - include `invoiceId` always
   - include `quoteId` when present
5. Profit calculation:
   - compute `profit = amount - cost` when `cost` is provided
