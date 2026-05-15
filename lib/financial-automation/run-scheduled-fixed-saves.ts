import {
  AutomationExecutionStatus,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  Prisma,
  SubscriptionLevel,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  automationAllocationSourceForRule,
  appendAutomationEnvelopeContribution,
} from '@/lib/financial-automation/allocation-persistence';
import { hasAdvancedAutomationAccess } from '@/lib/financial-automation/premium';
import {
  isFixedScheduleAutomationConditions,
  parseFixedScheduleAmountAction,
  shouldRunFixedScheduleUtc,
} from '@/lib/financial-automation/fixed-schedule-save-rule';

export type ScheduledFixedSavesSummary = {
  evaluated: number;
  applied: number;
  skipped: number;
  errors: number;
};

/**
 * Daily cron: credit fixed USD amounts into automation envelopes when schedule matches UTC calendar day.
 */
export async function runScheduledFixedSavesForAllUsers(now: Date = new Date()): Promise<ScheduledFixedSavesSummary> {
  const summary: ScheduledFixedSavesSummary = {
    evaluated: 0,
    applied: 0,
    skipped: 0,
    errors: 0,
  };

  const rules = await prisma.automationRule.findMany({
    where: {
      enabled: true,
      triggerType: 'SCHEDULED',
      type: 'ALLOCATION',
    },
    select: {
      id: true,
      userId: true,
      name: true,
      actions: true,
      conditions: true,
      schedule: true,
      premiumRequired: true,
    },
  });

  const dayKey = now.toISOString().slice(0, 10);
  const triggerRef = `scheduled-fixed-save:${dayKey}`;

  for (const rule of rules) {
    if (!isFixedScheduleAutomationConditions(rule.conditions)) continue;
    summary.evaluated++;

    if (!shouldRunFixedScheduleUtc(now, rule.schedule)) {
      summary.skipped++;
      continue;
    }

    const user = await prisma.user.findUnique({
      where: { id: rule.userId },
      select: { subscriptionLevel: true },
    });
    const subscriptionLevel = user?.subscriptionLevel ?? SubscriptionLevel.FREE;
    if (rule.premiumRequired && !hasAdvancedAutomationAccess(subscriptionLevel)) {
      await prisma.automationExecution.create({
        data: {
          userId: rule.userId,
          ruleId: rule.id,
          triggerRef,
          status: AutomationExecutionStatus.SKIPPED,
          errorCode: 'PREMIUM_REQUIRED',
          errorMessage: 'Premium subscription required',
          completedAt: new Date(),
        },
      });
      summary.skipped++;
      continue;
    }

    const action = parseFixedScheduleAmountAction(rule.actions);
    if (!action) {
      summary.errors++;
      continue;
    }

    const dup = await prisma.automationExecution.findFirst({
      where: {
        userId: rule.userId,
        ruleId: rule.id,
        triggerRef,
        status: AutomationExecutionStatus.SUCCEEDED,
      },
    });
    if (dup) {
      summary.skipped++;
      continue;
    }

    try {
      const allocationSource = automationAllocationSourceForRule(rule.id);
      await appendAutomationEnvelopeContribution({
        userId: rule.userId,
        ruleId: rule.id,
        ruleName: rule.name,
        allocationSource,
        bucketSlug: action.bucket,
        amount: action.amountUsd,
        description: `${rule.name} · ${dayKey}`,
        financialTransactionId: null,
      });

      await prisma.automationExecution.create({
        data: {
          userId: rule.userId,
          ruleId: rule.id,
          triggerRef,
          status: AutomationExecutionStatus.SUCCEEDED,
          resultSnapshot: {
            applied: true,
            amountUsd: action.amountUsd,
            bucket: action.bucket,
          } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await createFinancialEventSafe({
        userId: rule.userId,
        type: FinancialEventType.AUTOMATION_RULE_EXECUTED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_RULE,
        relatedEntityId: rule.id,
        metadata: {
          triggerRef,
          scheduledFixedSave: true,
          amountUsd: action.amountUsd,
          bucket: action.bucket,
        },
      });

      summary.applied++;
    } catch {
      summary.errors++;
      await prisma.automationExecution.create({
        data: {
          userId: rule.userId,
          ruleId: rule.id,
          triggerRef,
          status: AutomationExecutionStatus.FAILED,
          errorCode: 'SCHEDULED_SAVE_FAILED',
          errorMessage: 'Could not apply scheduled fixed save',
          completedAt: new Date(),
        },
      });
    }
  }

  return summary;
}
