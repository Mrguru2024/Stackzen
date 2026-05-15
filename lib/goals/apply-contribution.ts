import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  NotificationSeverity,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { goalAllocationSource } from '@/lib/goals/constants';

const MILESTONE_PCTS = [25, 50, 75, 100] as const;

function crossedMilestone(prev: number, next: number, target: number): number | null {
  if (target <= 0) return null;
  for (const p of MILESTONE_PCTS) {
    const threshold = (target * p) / 100;
    if (prev < threshold && next >= threshold - 0.01) return p;
  }
  return null;
}

/**
 * Records a manual (or engine-driven) contribution: SmartAllocation + bucket increment + events.
 */
export async function recordGoalContribution(input: {
  userId: string;
  goalId: string;
  amount: number;
  note?: string;
  financialTransactionId?: string | null;
}): Promise<{ newBucketBalance: number }> {
  const amt = Number(input.amount.toFixed(2));
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new Error('Contribution amount must be a positive number.');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const goal = await tx.operationalGoal.findFirst({
      where: {
        id: input.goalId,
        userId: input.userId,
        status: OperationalGoalStatus.ACTIVE,
      },
      include: { smartBucket: true },
    });
    if (!goal) throw new Error('Goal not found or not active.');

    const prevProgress = Math.min(goal.smartBucket.currentAmount, goal.targetAmount);

    await tx.smartAllocation.create({
      data: {
        userId: input.userId,
        bucketId: goal.smartBucketId,
        amount: amt,
        source: goalAllocationSource(goal.id),
        description: input.note?.trim() || `Goal contribution · ${goal.name}`,
        financialTransactionId: input.financialTransactionId ?? undefined,
      },
    });

    const updated = await tx.smartBucket.update({
      where: { id: goal.smartBucketId },
      data: { currentAmount: { increment: amt } },
    });

    await tx.operationalGoal.update({
      where: { id: goal.id },
      data: { lastContributionAt: new Date() },
    });

    const nextProgress = Math.min(updated.currentAmount, goal.targetAmount);
    const milestone = crossedMilestone(prevProgress, nextProgress, goal.targetAmount);

    if (nextProgress >= goal.targetAmount - 0.01) {
      await tx.operationalGoal.update({
        where: { id: goal.id },
        data: { status: OperationalGoalStatus.COMPLETED },
      });
    }

    return { goal, updated, milestone, nextProgress };
  });

  await createFinancialEventSafe({
    userId: input.userId,
    type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
    source: FinancialEventSource.API_GOALS,
    amount: amt,
    relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
    relatedEntityId: input.goalId,
    metadata: {
      bucketId: result.goal.smartBucketId,
      newBalance: result.updated.currentAmount,
    },
  });

  if (result.milestone != null) {
    await createAutomationNotification({
      userId: input.userId,
      type: AutomationNotificationType.GOAL_MILESTONE,
      severity: NotificationSeverity.INFO,
      title: `Goal milestone · ${result.goal.name}`,
      body: `You crossed ${result.milestone}% of your $${result.goal.targetAmount.toFixed(2)} target in bucket "${result.goal.smartBucket.name}".`,
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: result.goal.id,
      metadata: buildOperationalAttentionMetadata(
        [{ type: 'OPEN_OPERATIONAL_GOAL', goalId: result.goal.id }],
        {
          attentionKind: `goal_milestone_${result.milestone}_${result.goal.id}`,
          trust: {
            why: `Bucket balance reached ${result.milestone}% of the configured goal target using recorded SmartAllocation rows.`,
            recommendedNextStep: 'Review pace and forecast on the Operational Goals page, or adjust your target date.',
            sourceEventType: 'GOAL_MILESTONE_REACHED',
          },
        }
      ),
    });

    await createFinancialEventSafe({
      userId: input.userId,
      type: FinancialEventType.GOAL_MILESTONE_REACHED,
      source: FinancialEventSource.API_GOALS,
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: result.goal.id,
      metadata: { milestonePercent: result.milestone, balance: result.updated.currentAmount },
    });
  }

  return { newBucketBalance: result.updated.currentAmount };
}
