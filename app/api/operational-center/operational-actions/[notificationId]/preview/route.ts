import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildOperationalActionPreview } from '@/lib/operational-actions/preview';

const paramsSchema = z.object({ notificationId: z.string().cuid() });

export async function POST(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { notificationId } = await context.params;
  if (!paramsSchema.safeParse({ notificationId }).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  const preview = await buildOperationalActionPreview(session.user.id, notificationId);
  if (!preview) {
    return NextResponse.json({ error: 'Preview not available' }, { status: 404 });
  }

  return NextResponse.json(preview);
}
