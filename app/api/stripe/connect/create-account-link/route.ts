import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { createOnboardingLink } from '@/lib/stripe/connect';

/**
 * Legacy alias kept for the StripeOnboardButton component. Prefer
 * `POST /api/stripe/connect/onboard`.
 */
export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;
  try {
    const url = await createOnboardingLink(session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[stripe_connect_create_account_link]', error);
    return NextResponse.json({ message: 'Unable to start onboarding' }, { status: 500 });
  }
}
