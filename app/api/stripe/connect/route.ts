import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { createOnboardingLink, getCachedStatus } from '@/lib/stripe/connect';
import { responseIfConnectNotEnabled } from '@/lib/stripe/connect-onboarding-errors';

/**
 * Legacy entry-point preserved for older clients (StripeConnectButton). New
 * code should call `POST /api/stripe/connect/onboard` and
 * `GET /api/stripe/connect/status` directly.
 */

export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;
  try {
    const url = await createOnboardingLink(session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[stripe_connect_legacy_post]', error);
    const notEnabled = responseIfConnectNotEnabled(error);
    if (notEnabled) return notEnabled;
    return NextResponse.json({ error: 'Unable to start onboarding' }, { status: 500 });
  }
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;
  try {
    const status = await getCachedStatus(session.user.id);
    if (!status.connected) {
      const url = await createOnboardingLink(session.user.id);
      return NextResponse.json({ url });
    }
    const url = await createOnboardingLink(session.user.id);
    return NextResponse.json({ url, status });
  } catch (error) {
    console.error('[stripe_connect_legacy_get]', error);
    const notEnabled = responseIfConnectNotEnabled(error);
    if (notEnabled) return notEnabled;
    return NextResponse.json({ error: 'Unable to load status' }, { status: 500 });
  }
}
