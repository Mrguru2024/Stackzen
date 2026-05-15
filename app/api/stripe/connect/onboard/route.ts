import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { createOnboardingLink } from '@/lib/stripe/connect';
import { responseIfConnectNotEnabled } from '@/lib/stripe/connect-onboarding-errors';

/**
 * Starts (or resumes) Stripe Standard onboarding for the signed-in user.
 *
 * The route never embeds Stripe's hosted forms — Stripe handles ID verification,
 * bank linking, and tax forms in their own pages. We just hand the user a
 * one-time URL.
 */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'stripe_connect_onboard');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const url = await createOnboardingLink(session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[stripe_connect_onboard]', error);
    const notEnabled = responseIfConnectNotEnabled(error);
    if (notEnabled) return notEnabled;
    const message = error instanceof Error ? error.message : 'Unable to start Stripe onboarding';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
