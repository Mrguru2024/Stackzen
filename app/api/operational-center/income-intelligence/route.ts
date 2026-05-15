import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildIncomeIntelligenceSnapshot } from '@/lib/income-intelligence/snapshot';
import { ensureIncomeIntelligenceAttentionNotifications } from '@/lib/income-intelligence/ensure-attention';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';

  const snapshot = await buildIncomeIntelligenceSnapshot(session.user.id);
  if (ensure) {
    await ensureIncomeIntelligenceAttentionNotifications(session.user.id, snapshot);
  }

  return NextResponse.json(snapshot);
}
