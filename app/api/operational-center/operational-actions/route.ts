import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { ensureOperationalActionProposals } from '@/lib/operational-actions/ensure-proposals';
import { listPendingOperationalProposals } from '@/lib/operational-actions/list-pending';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';
  if (ensure) {
    await ensureOperationalActionProposals(session.user.id);
  }

  const proposals = await listPendingOperationalProposals(session.user.id);
  return NextResponse.json({ proposals });
}
