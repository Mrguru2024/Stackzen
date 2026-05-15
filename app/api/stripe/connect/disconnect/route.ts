import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { disconnectAccount } from '@/lib/stripe/connect';

/**
 * Soft-disconnect: drops StackZen's pointer to the user's Stripe account.
 * The Stripe account itself is not deleted (it belongs to the user) so they
 * can reconnect with one click later.
 */
export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    await disconnectAccount(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[stripe_connect_disconnect]', error);
    return NextResponse.json({ error: 'Unable to disconnect' }, { status: 500 });
  }
}
