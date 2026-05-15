import { NextResponse } from 'next/server';

/**
 * Stripe returns this when the platform account has not finished Connect signup
 * in the Dashboard (same Test/Live mode as the secret key).
 */
export function responseIfConnectNotEnabled(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : '';
  if (!message.includes('signed up for Connect')) return null;

  return NextResponse.json(
    {
      error:
        'Stripe Connect is not enabled for this platform account. In the Stripe Dashboard, use the same mode as your secret key (Test vs Live), open Connect, and finish platform setup—then try again.',
      code: 'STRIPE_CONNECT_NOT_ENABLED',
      dashboardUrl: 'https://dashboard.stripe.com/connect',
    },
    { status: 400 }
  );
}
