import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { hasAdvancedAutomationAccess } from '@/lib/financial-automation/premium';

const patchSchema = z
  .object({
    enabled: z.boolean().optional(),
    priority: z.number().int().min(0).max(10000).optional(),
    name: z.string().min(2).max(120).optional(),
  })
  .strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid rule id' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const existing = await prisma.automationRule.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const premium = hasAdvancedAutomationAccess(user?.subscriptionLevel);

  if (parsed.data.enabled === true) {
    const otherActiveCount = await prisma.automationRule.count({
      where: {
        userId: session.user.id,
        enabled: true,
        id: { not: id },
      },
    });
    if (!premium && otherActiveCount >= 1) {
      return NextResponse.json(
        { error: 'Free tier supports one enabled automation rule. Pause another rule first.' },
        { status: 403 }
      );
    }
  }

  if (parsed.data.priority !== undefined && !premium) {
    return NextResponse.json(
      { error: 'Changing rule priority requires Pro or higher.' },
      { status: 403 }
    );
  }

  const data: Prisma.AutomationRuleUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;

  const updated = await prisma.automationRule.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
