import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildReserveAllocationSnapshot } from '@/lib/reserve-allocation-intelligence/snapshot';
import { ensureReserveAllocationAttentionNotifications } from '@/lib/reserve-allocation-intelligence/ensure-attention';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';

  const snapshot = await buildReserveAllocationSnapshot(session.user.id);
  if (ensure) {
    await ensureReserveAllocationAttentionNotifications(session.user.id, snapshot);
  }

  return NextResponse.json(snapshot);
}
