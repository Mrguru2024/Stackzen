import 'server-only';
import Stripe from 'stripe';

/**
 * Single source-of-truth Stripe SDK factory.
 *
 * Stripe pins API versions explicitly so that surface-area changes in newer
 * releases never silently leak through to runtime callers.
 */
const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-05-28.basil';

let cached: Stripe | null = null;

/**
 * Returns a process-wide Stripe client. Throws if the secret is unset so that
 * misconfiguration surfaces at the first call instead of at webhook time.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  cached = new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: {
      name: 'StackZen',
      url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://stackzen.app',
    },
  });
  return cached;
}

/** Convenience: tiny helper for routes that just need to issue API calls. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

export const STRIPE_API_VERSION_LITERAL = STRIPE_API_VERSION;
