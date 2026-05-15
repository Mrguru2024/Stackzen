import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { getCachedStatus, syncConnectedAccount } from '@/lib/stripe/connect';

/**
 * GET  — fast read from our DB (used on render).
 * POST — pulls fresh state from Stripe and writes it back. Called from the
 *         StripeConnectCard's "Refresh status" action and after onboarding.
 */
export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const status = await getCachedStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[stripe_connect_status_get]', error);
    return NextResponse.json({ error: 'Unable to load status' }, { status: 500 });
  }
}

export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const status = await syncConnectedAccount(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[stripe_connect_status_post]', error);
    return NextResponse.json({ error: 'Unable to refresh status' }, { status: 500 });
  }
}
