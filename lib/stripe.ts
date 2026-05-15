/**
 * Backwards-compatible re-export shim. New code should import from
 * `@/lib/stripe/client` (and `@/lib/stripe/connect`, `@/lib/stripe/invoices`).
 *
 * Kept so existing import sites (`@/lib/stripe`) continue to resolve while we
 * migrate them. Do not add new logic here.
 */
export { stripe, getStripe, STRIPE_API_VERSION_LITERAL } from './stripe/client';

export const webhookEvents = {
  'customer.subscription.created': true,
  'customer.subscription.updated': true,
  'customer.subscription.deleted': true,
  'payment_intent.succeeded': true,
  'payment_intent.payment_failed': true,
  'invoice.payment_succeeded': true,
  'invoice.payment_failed': true,
  'invoice.paid': true,
  'account.updated': true,
} as const;

export type WebhookEvent = keyof typeof webhookEvents;
