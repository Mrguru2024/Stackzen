import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { recordGoalContribution } from '@/lib/goals/apply-contribution';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  amount: z.number().positive().finite(),
  note: z.string().max(500).optional(),
  financialTransactionId: z.string().min(1).optional().nullable(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id: goalId } = await context.params;
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const owns = await prisma.operationalGoal.findFirst({
    where: { id: goalId, userId: session.user.id },
    select: { id: true },
  });
  if (!owns) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (parsed.data.financialTransactionId) {
    const txRow = await prisma.financialTransaction.findFirst({
      where: { id: parsed.data.financialTransactionId, userId: session.user.id },
      select: { id: true },
    });
    if (!txRow) {
      return NextResponse.json({ error: 'Financial transaction not found' }, { status: 404 });
    }
  }

  try {
    const out = await recordGoalContribution({
      userId: session.user.id,
      goalId,
      amount: parsed.data.amount,
      note: parsed.data.note,
      financialTransactionId: parsed.data.financialTransactionId ?? undefined,
    });
    return NextResponse.json({ ok: true, newBucketBalance: out.newBucketBalance });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    if (msg.includes('not active')) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error('[goal contribution]', e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
