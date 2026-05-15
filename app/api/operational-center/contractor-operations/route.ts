import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildContractorFinancialOpsSnapshot } from '@/lib/contractor-operations/snapshot';
import { ensureContractorOperationalAttentionNotifications } from '@/lib/contractor-operations/ensure-attention';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';

  const snapshot = await buildContractorFinancialOpsSnapshot(session.user.id);
  if (ensure) {
    await ensureContractorOperationalAttentionNotifications(session.user.id, snapshot);
  }

  return NextResponse.json(snapshot);
}
