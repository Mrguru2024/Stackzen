import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { ensureTimingCoordinationAttentionNotifications } from '@/lib/timing-coordination/ensure-attention';
import { buildTimingCoordinationSnapshot } from '@/lib/timing-coordination/snapshot';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';

  const snapshot = await buildTimingCoordinationSnapshot(session.user.id);
  if (ensure) {
    await ensureTimingCoordinationAttentionNotifications(session.user.id, snapshot);
  }

  return NextResponse.json(snapshot);
}
