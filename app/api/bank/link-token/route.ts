import { NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/bank/plaid';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { isPlaidConfigured } from '@/lib/env';

export async function GET(request: Request) {
  const limited = await enforceApiRateLimit(request, 'plaid_link_token');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: 'Bank linking is not configured' }, { status: 503 });
  }

  try {
    const linkResponse = await createLinkToken(session.user.id);
    return NextResponse.json(linkResponse.data);
  } catch {
    console.error('[BANK_LINK_TOKEN] error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
