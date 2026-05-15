import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, SubscriptionLevel } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { hasAdvancedAutomationAccess, resolveFreeAllocationPreset, isFreeTierAllocationPreset } from '@/lib/financial-automation/premium';
import {
  availableRuleTemplates,
  buildRuleFromTemplate,
  getRuleTemplate,
  type RuleTemplateId,
} from '@/lib/financial-automation/rule-templates';
import { isSpendRoundUpConditions } from '@/lib/financial-automation/spend-round-up-rule';
import {
  isFixedScheduleAutomationConditions,
  parseFixedScheduleAmountAction,
  parseFixedScheduleConfig,
} from '@/lib/financial-automation/fixed-schedule-save-rule';
import { isCategorySpendTaxConditions, parseCategorySpendTaxAction } from '@/lib/financial-automation/category-spend-tax-rule';

const TEMPLATE_IDS = [
  'BUDGET_SPLIT_50_30_20',
  'BUDGET_SPLIT_40_30_30',
  'BUDGET_SPLIT_CUSTOM',
  'PAYCHECK_SAVINGS_BOOST',
  'SPEND_ROUND_UP_SAVINGS',
  'SCHEDULED_FIXED_SAVE_USD',
  'CATEGORY_SPEND_TAX',
  'TAX_RESERVE_ON_SELF_EMPLOYED',
  'CATEGORY_GUARDRAIL',
] as const satisfies readonly RuleTemplateId[];

const allocationLineSchema = z.object({
  bucket: z.string().min(1).max(60),
  percent: z.number().min(0).max(100),
});

const instantiateSchema = z
  .object({
    templateId: z.enum(TEMPLATE_IDS),
    input: z
      .object({
        allocationsCustom: z.array(allocationLineSchema).optional(),
        savingsBucket: z.string().min(1).max(60).optional(),
        savingsPercent: z.number().min(0).max(100).optional(),
        roundUpBucket: z.string().min(1).max(60).optional(),
        roundUpIncrement: z.number().min(0.5).max(100).optional(),
        scheduleCadence: z.string().min(3).max(20).optional(),
        scheduleBucket: z.string().min(1).max(60).optional(),
        scheduleAmountUsd: z.number().min(1).max(500).optional(),
        scheduleDayOfWeek: z.number().min(0).max(6).optional(),
        scheduleDayOfMonth: z.number().min(1).max(28).optional(),
        taxCategory: z.string().min(1).max(120).optional(),
        taxDestinationBucket: z.string().min(1).max(60).optional(),
        taxSpendPercent: z.number().min(1).max(50).optional(),
        taxMaxAmountUsd: z.number().min(1).max(500).optional(),
        reserveBucket: z.string().min(1).max(60).optional(),
        reservePercent: z.number().min(0).max(100).optional(),
        guardrailCategory: z.string().min(1).max(120).optional(),
        guardrailLimit: z.number().min(1).optional(),
        guardrailWarnAt: z.number().min(50).max(100).optional(),
      })
      .optional()
      .default({}),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionLevel: true },
  });
  const subscriptionLevel = user?.subscriptionLevel ?? SubscriptionLevel.FREE;

  return NextResponse.json({
    subscriptionLevel,
    templates: availableRuleTemplates(subscriptionLevel),
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = instantiateSchema.safeParse(await request.json());
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

  const template = getRuleTemplate(parsed.data.templateId);
  if (!template) {
    return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
  }
  if (template.premium && !premium) {
    return NextResponse.json(
      { error: 'This template requires a Pro subscription.' },
      { status: 403 }
    );
  }

  let built;
  try {
    built = buildRuleFromTemplate(parsed.data.templateId, parsed.data.input ?? {}, {
      subscriptionLevel,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not build template rule.' },
      { status: 400 }
    );
  }

  if (built.rulePayload.type === 'ALLOCATION' && !premium) {
    const enabledCount = await prisma.automationRule.count({
      where: { userId: session.user.id, enabled: true },
    });
    if (enabledCount >= 1) {
      return NextResponse.json(
        {
          error:
            'Free tier supports one enabled automation rule. Pause an existing rule before adding a new one.',
        },
        { status: 403 }
      );
    }
  }

  let actions: Array<Record<string, unknown>> = built.rulePayload.actions ?? [];
  const isSpendRoundUp =
    built.rulePayload.type === 'ALLOCATION' && isSpendRoundUpConditions(built.rulePayload.conditions);
  const isFixedSchedule =
    built.rulePayload.type === 'ALLOCATION' &&
    built.rulePayload.triggerType === 'SCHEDULED' &&
    isFixedScheduleAutomationConditions(built.rulePayload.conditions);
  const isCategorySpendTax =
    built.rulePayload.type === 'ALLOCATION' &&
    built.rulePayload.triggerType === 'TRANSACTION_POSTED' &&
    isCategorySpendTaxConditions(built.rulePayload.conditions);

  if (isFixedSchedule) {
    if (!parseFixedScheduleConfig(built.rulePayload.schedule)) {
      return NextResponse.json({ error: 'Invalid schedule for fixed save rule.' }, { status: 400 });
    }
    if (!parseFixedScheduleAmountAction(actions as unknown as Prisma.JsonValue)) {
      return NextResponse.json({ error: 'Invalid actions for fixed save rule.' }, { status: 400 });
    }
  }

  if (isCategorySpendTax) {
    if (!parseCategorySpendTaxAction(actions as unknown as Prisma.JsonValue)) {
      return NextResponse.json({ error: 'Invalid actions for category spend tax rule.' }, { status: 400 });
    }
  }

  if (built.rulePayload.type === 'ALLOCATION') {
    if (!isSpendRoundUp && !isFixedSchedule && !isCategorySpendTax && built.rulePayload.allocationPreset) {
      actions = resolveFreeAllocationPreset(built.rulePayload.allocationPreset);
    }
    if (actions.length === 0) {
      return NextResponse.json(
        { error: 'Allocation template did not produce any actions.' },
        { status: 400 }
      );
    }
  }

  const allocationBuckets =
    built.rulePayload.type === 'ALLOCATION' && !isSpendRoundUp && !isFixedSchedule && !isCategorySpendTax
      ? (actions as Array<{ bucket: string; percent: number }>)
      : [];

  const premiumRequired =
    built.rulePayload.type === 'ALLOCATION' &&
    !isSpendRoundUp &&
    !isFixedSchedule &&
    !isCategorySpendTax &&
    allocationBuckets.length > 0 &&
    !isFreeTierAllocationPreset(allocationBuckets);

  const conditionsJson = (built.rulePayload.conditions ?? undefined) as Prisma.InputJsonValue | undefined;
  const actionsJson = actions as unknown as Prisma.InputJsonValue;
  const scheduleJson = (built.rulePayload.schedule ?? undefined) as Prisma.InputJsonValue | undefined;

  const created = await prisma.$transaction(async tx => {
    const rule = await tx.automationRule.create({
      data: {
        userId: session.user.id,
        name: built.rulePayload.name,
        type: built.rulePayload.type,
        triggerType: built.rulePayload.triggerType,
        conditions: conditionsJson,
        actions: actionsJson,
        schedule: scheduleJson,
        enabled: built.rulePayload.enabled ?? true,
        premiumRequired,
      },
    });

    if (built.guardrailPolicy) {
      await tx.spendingGuardrailPolicy.create({
        data: {
          userId: session.user.id,
          categoryName: built.guardrailPolicy.categoryName,
          limitAmount: built.guardrailPolicy.limitAmount,
          warnAtPercent: built.guardrailPolicy.warnAtPercent,
          enabled: true,
        },
      });
    }

    return rule;
  });

  return NextResponse.json(created, { status: 201 });
}
