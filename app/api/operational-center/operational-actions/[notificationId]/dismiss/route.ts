import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { OperationalActionApplicationError } from '@/lib/operational-actions/errors';
import { dismissOperationalProposal } from '@/lib/operational-actions/dismiss';

const paramsSchema = z.object({ notificationId: z.string().cuid() });

export async function POST(_request: Request, context: { params: Promise<{ notificationId: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { notificationId } = await context.params;
  if (!paramsSchema.safeParse({ notificationId }).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  try {
    await dismissOperationalProposal(session.user.id, notificationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperationalActionApplicationError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.error('[operational-actions/dismiss]', e);
    return NextResponse.json({ error: 'Dismiss failed' }, { status: 500 });
  }
}
