import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { hasAdvancedAutomationAccess } from '@/lib/financial-automation/premium';

const guardrailSchema = z
  .object({
    categoryName: z.string().max(120).optional(),
    cycle: z.enum(['WEEKLY', 'MONTHLY']),
    limitAmount: z.number().positive(),
    warnAtPercent: z.number().int().min(1).max(100).optional(),
    softBlockEnabled: z.boolean().optional(),
    aiCoachModeEnabled: z.boolean().optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const rows = await prisma.spendingGuardrailPolicy.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = guardrailSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const premium = hasAdvancedAutomationAccess(user?.subscriptionLevel);

  if (!premium && parsed.data.aiCoachModeEnabled) {
    return NextResponse.json({ error: 'AI coach mode requires Pro or higher' }, { status: 403 });
  }

  const created = await prisma.spendingGuardrailPolicy.create({
    data: {
      userId: session.user.id,
      categoryName: parsed.data.categoryName ?? null,
      cycle: parsed.data.cycle,
      limitAmount: parsed.data.limitAmount,
      warnAtPercent: parsed.data.warnAtPercent ?? 80,
      softBlockEnabled: parsed.data.softBlockEnabled ?? false,
      aiCoachModeEnabled: parsed.data.aiCoachModeEnabled ?? false,
      enabled: parsed.data.enabled ?? true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
