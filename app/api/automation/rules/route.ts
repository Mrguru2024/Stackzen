import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  FREE_TIER_CANONICAL_PRESET_ID,
  hasAdvancedAutomationAccess,
  isFreeTierAllocationPreset,
  resolveFreeAllocationPreset,
} from '@/lib/financial-automation/premium';

function allocationPercentsValid(actions: Array<Record<string, unknown>>): boolean {
  if (!actions.length) return false;
  const percents = actions.map(a => Number(a.percent));
  if (percents.some(p => !Number.isFinite(p))) return false;
  const buckets = actions.map(a => String(a.bucket ?? '').trim().toLowerCase());
  if (buckets.some(b => !b)) return false;
  const sum = percents.reduce((s, n) => s + n, 0);
  return Math.abs(sum - 100) <= 0.05;
}

const ruleSchema = z
  .object({
    name: z.string().min(2).max(120),
    type: z.enum(['ALLOCATION', 'GUARDRAIL', 'NOTIFICATION', 'RECURRING_TRANSFER']),
    triggerType: z.enum([
      'TRANSACTION_POSTED',
      'PAYCHECK_DETECTED',
      'SCHEDULED',
      'BILL_DUE',
      'BALANCE_THRESHOLD',
    ]),
    conditions: z.record(z.unknown()).optional(),
    actions: z.array(z.record(z.unknown())).optional(),
    schedule: z.record(z.unknown()).optional(),
    enabled: z.boolean().optional(),
    allocationPreset: z.enum(['FIFTY_THIRTY_TWENTY', 'FORTY_THIRTY_THIRTY']).optional(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const rules = await prisma.automationRule.findMany({
    where: { userId: session.user.id },
    orderBy: [{ enabled: 'desc' }, { priority: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const premium = hasAdvancedAutomationAccess(user?.subscriptionLevel);

  const existingCount = await prisma.automationRule.count({
    where: { userId: session.user.id, enabled: true },
  });

  if (!premium && existingCount >= 1) {
    return NextResponse.json(
      { error: 'Free tier supports one active automation rule only' },
      { status: 403 }
    );
  }

  let actions: Array<Record<string, unknown>>;
  const preset = parsed.data.allocationPreset;

  if (parsed.data.type !== 'ALLOCATION') {
    actions = parsed.data.actions ?? [];
  } else {
    const hasActions = parsed.data.actions && parsed.data.actions.length > 0;
    if (!premium && hasActions) {
      return NextResponse.json(
        {
          error:
            'Free tier allocation rules must use allocationPreset only. Remove custom actions or upgrade to Pro.',
        },
        { status: 403 }
      );
    }
    if (!premium && preset && preset !== FREE_TIER_CANONICAL_PRESET_ID) {
      return NextResponse.json(
        { error: 'Choosing a different preset requires a Pro subscription.' },
        { status: 403 }
      );
    }
    if (premium && hasActions && !allocationPercentsValid(parsed.data.actions!)) {
      return NextResponse.json(
        { error: 'Allocation actions must set bucket + percent and percents must sum to ~100%.' },
        { status: 400 }
      );
    }
    if (!premium) {
      actions = resolveFreeAllocationPreset(preset ?? undefined);
    } else if (hasActions) {
      actions = parsed.data.actions!;
    } else {
      actions = resolveFreeAllocationPreset(preset ?? undefined);
    }
  }

  const allocationBuckets =
    parsed.data.type === 'ALLOCATION'
      ? (actions as Array<{ bucket: string; percent: number }>)
      : ([] as Array<{ bucket: string; percent: number }>);

  const premiumRequired =
    parsed.data.type === 'ALLOCATION' &&
    allocationBuckets.length > 0 &&
    !isFreeTierAllocationPreset(allocationBuckets);

  const created = await prisma.automationRule.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      triggerType: parsed.data.triggerType,
      conditions: (parsed.data.conditions ?? undefined) as Prisma.InputJsonValue | undefined,
      actions: actions as unknown as Prisma.InputJsonValue,
      schedule: (parsed.data.schedule ?? undefined) as Prisma.InputJsonValue | undefined,
      enabled: parsed.data.enabled ?? true,
      premiumRequired,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
