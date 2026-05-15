import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { applyOperationalFinancialAction } from '@/lib/operational-actions/apply';
import { OperationalActionApplicationError } from '@/lib/operational-actions/errors';

const paramsSchema = z.object({ notificationId: z.string().cuid() });

const bodySchema = z
  .object({
    confirm: z.literal(true),
    acknowledgedImpact: z.literal(true),
  })
  .strict();

export async function POST(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { notificationId } = await context.params;
  if (!paramsSchema.safeParse({ notificationId }).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Explicit approval required', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await applyOperationalFinancialAction({
      userId: session.user.id,
      notificationId,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OperationalActionApplicationError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.error('[operational-actions/apply]', e);
    return NextResponse.json({ error: 'Apply failed' }, { status: 500 });
  }
}
