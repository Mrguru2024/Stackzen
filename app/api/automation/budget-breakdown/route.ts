import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, SubscriptionLevel } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  FREE_TIER_CANONICAL_PRESET_ID,
  hasAdvancedAutomationAccess,
  isFreeTierAllocationPreset,
  resolveFreeAllocationPreset,
} from '@/lib/financial-automation/premium';
import { isAllocationPercentSumValid, normalizeBucketSlug } from '@/lib/financial-automation/rule-templates';
import {
  BUDGET_MAIN_CONDITION_KEY,
  BUDGET_MAIN_RULE_NAME,
  isBudgetMainAutomationConditions,
} from '@/lib/financial-automation/budget-main-rule';
import { resyncBudgetRuleAfterSave } from '@/lib/financial-automation/resync-budget-allocations';

const INCOME_OPERATIONAL_CLASSES = ['INCOME', 'PAYCHECK', 'GIG_PAYMENT', 'CONTRACTOR_PAYMENT'] as const;

const allocationLineSchema = z.object({
  bucket: z.string().min(1).max(60),
  percent: z.number().min(0).max(100),
});

const upsertSchema = z
  .object({
    active: z.boolean(),
    preset: z.enum(['FIFTY_THIRTY_TWENTY', 'FORTY_THIRTY_THIRTY']).optional(),
    customAllocations: z.array(allocationLineSchema).optional(),
  })
  .strict()
  .refine(
    payload => payload.active === false || payload.preset !== undefined || (payload.customAllocations?.length ?? 0) > 0,
    'Provide either a preset or customAllocations when activating the budget split.'
  );

function defaultBudgetMainConditions(): Record<string, unknown> {
  return {
    [BUDGET_MAIN_CONDITION_KEY]: true,
    directions: ['INFLOW'],
    excludeTransfers: true,
    operationalClasses: [...INCOME_OPERATIONAL_CLASSES],
  };
}

async function findBudgetMainRule(userId: string) {
  const all = await prisma.automationRule.findMany({
    where: { userId, type: 'ALLOCATION' },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });
  return all.find(r => isBudgetMainAutomationConditions(r.conditions)) ?? null;
}

function readActionsAsAllocations(actions: Prisma.JsonValue): Array<{ bucket: string; percent: number }> {
  if (!Array.isArray(actions)) return [];
  const lines: Array<{ bucket: string; percent: number }> = [];
  for (const raw of actions) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const rec = raw as Record<string, unknown>;
    const bucket = typeof rec.bucket === 'string' ? rec.bucket : null;
    const percent = typeof rec.percent === 'number' ? rec.percent : Number(rec.percent);
    if (!bucket || !Number.isFinite(percent)) continue;
    lines.push({ bucket, percent });
  }
  return lines;
}

async function computeIncomeProjection(userId: string) {
  const lookbackDays = 60;
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const incomeInflows = await prisma.financialTransaction.findMany({
    where: {
      userId,
      direction: 'INFLOW',
      isTransfer: false,
      postedAt: { gte: since },
    },
    select: { amount: true },
  });

  const totalInflow = incomeInflows.reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const inflowCount = incomeInflows.length;
  const avgPerDeposit = inflowCount > 0 ? totalInflow / inflowCount : 0;
  const avgMonthly = totalInflow / 2; // 60-day window → average per 30-day month

  return {
    lookbackDays,
    inflowCount,
    totalInflow: Number(totalInflow.toFixed(2)),
    avgPerDeposit: Number(avgPerDeposit.toFixed(2)),
    avgMonthly: Number(avgMonthly.toFixed(2)),
  };
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const subscriptionLevel = user?.subscriptionLevel ?? SubscriptionLevel.FREE;
  const premium = hasAdvancedAutomationAccess(subscriptionLevel);

  const rule = await findBudgetMainRule(session.user.id);
  const allocations = rule ? readActionsAsAllocations(rule.actions) : [];
  const projection = await computeIncomeProjection(session.user.id);

  return NextResponse.json({
    subscriptionLevel,
    premium,
    active: rule?.enabled ?? false,
    ruleId: rule?.id ?? null,
    allocations,
    isPresetFreeTier: allocations.length > 0 ? isFreeTierAllocationPreset(allocations) : false,
    projection,
    freePresets: {
      FIFTY_THIRTY_TWENTY: resolveFreeAllocationPreset('FIFTY_THIRTY_TWENTY'),
      FORTY_THIRTY_THIRTY: resolveFreeAllocationPreset('FORTY_THIRTY_THIRTY'),
    },
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = upsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const subscriptionLevel = user?.subscriptionLevel ?? SubscriptionLevel.FREE;
  const premium = hasAdvancedAutomationAccess(subscriptionLevel);

  const existing = await findBudgetMainRule(session.user.id);

  if (parsed.data.active === false) {
    if (!existing) {
      return NextResponse.json({ active: false, ruleId: null });
    }
    const updated = await prisma.automationRule.update({
      where: { id: existing.id },
      data: { enabled: false },
    });
    return NextResponse.json({ active: updated.enabled, ruleId: updated.id });
  }

  let actions: Array<{ bucket: string; percent: number }>;
  if (parsed.data.customAllocations && parsed.data.customAllocations.length > 0) {
    if (!premium) {
      return NextResponse.json(
        { error: 'Custom budget percentages require a Pro subscription.' },
        { status: 403 }
      );
    }
    const cleaned = parsed.data.customAllocations
      .map(line => ({
        bucket: normalizeBucketSlug(line.bucket),
        percent: Math.round(line.percent * 100) / 100,
      }))
      .filter(line => line.bucket.length > 0);
    if (!isAllocationPercentSumValid(cleaned)) {
      return NextResponse.json(
        { error: 'Custom budget percentages must total 100%.' },
        { status: 400 }
      );
    }
    actions = cleaned;
  } else {
    const requestedPreset = parsed.data.preset ?? FREE_TIER_CANONICAL_PRESET_ID;
    if (!premium && requestedPreset !== FREE_TIER_CANONICAL_PRESET_ID) {
      return NextResponse.json(
        { error: 'Choosing a different preset requires a Pro subscription.' },
        { status: 403 }
      );
    }
    actions = resolveFreeAllocationPreset(requestedPreset);
  }

  const premiumRequired = !isFreeTierAllocationPreset(actions);
  if (premiumRequired && !premium) {
    return NextResponse.json(
      { error: 'Custom budget percentages require a Pro subscription.' },
      { status: 403 }
    );
  }

  if (!premium && !existing) {
    const enabledCount = await prisma.automationRule.count({
      where: { userId: session.user.id, enabled: true },
    });
    if (enabledCount >= 1) {
      return NextResponse.json(
        {
          error:
            'Free tier supports one enabled automation rule. Pause an existing rule before activating the budget split.',
        },
        { status: 403 }
      );
    }
  }

  const conditions = defaultBudgetMainConditions();
  const actionsJson = actions as unknown as Prisma.InputJsonValue;
  const conditionsJson = conditions as unknown as Prisma.InputJsonValue;

  const saved = existing
    ? await prisma.automationRule.update({
        where: { id: existing.id },
        data: {
          enabled: true,
          conditions: conditionsJson,
          actions: actionsJson,
          premiumRequired,
        },
      })
    : await prisma.automationRule.create({
        data: {
          userId: session.user.id,
          name: BUDGET_MAIN_RULE_NAME,
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: conditionsJson,
          actions: actionsJson,
          enabled: true,
          premiumRequired,
        },
      });

  let allocationResync: { resynced: number; backfilled: number } | null = null;
  try {
    allocationResync = await resyncBudgetRuleAfterSave({
      userId: session.user.id,
      ruleId: saved.id,
    });
  } catch (error) {
    console.error('[budget-breakdown] allocation resync failed', error);
  }

  return NextResponse.json({
    active: saved.enabled,
    ruleId: saved.id,
    allocations: actions,
    premiumRequired,
    allocationResync,
  });
}
