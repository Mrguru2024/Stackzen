import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  OperationalGoalStatus,
} from '@prisma/client';
import { startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { recordGoalContribution } from '@/lib/goals/apply-contribution';
import { summarizeForecast } from '@/lib/operational-actions/forecast-summary';
import { loadOperationalProposalForUser } from '@/lib/operational-actions/load-proposal';
import { computeLiveFingerprint } from '@/lib/operational-actions/live-fingerprint';
import { readOperationalProposal } from '@/lib/operational-actions/metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { OperationalActionApplicationError } from '@/lib/operational-actions/errors';
import type { OperationalActionApplyResultDto, OperationalActionKind } from '@/lib/operational-actions/types';

export async function applyOperationalFinancialAction(input: {
  userId: string;
  notificationId: string;
}): Promise<OperationalActionApplyResultDto> {
  const loaded = await loadOperationalProposalForUser(input.userId, input.notificationId);
  if (!loaded) {
    throw new OperationalActionApplicationError('Proposal not found', 404);
  }
  if (loaded.proposal.status !== 'pending') {
    throw new OperationalActionApplicationError('Proposal is not pending', 409);
  }

  const forecastBefore = await buildCashFlowForecast(input.userId, { includeDetails: false });
  const liveFp = computeLiveFingerprint(forecastBefore, loaded.proposal);
  if (liveFp !== loaded.proposal.fingerprint) {
    throw new OperationalActionApplicationError(
      'This action is stale relative to the latest forecast. Refresh proposals and try again.',
      409
    );
  }

  const kind: OperationalActionKind = loaded.proposal.kind;

  switch (kind) {
    case 'PAUSE_AUTOMATION_RULE': {
      const p = loaded.proposal.payload as { ruleId: string };
      const rule = await prisma.automationRule.findFirst({
        where: { id: p.ruleId, userId: input.userId, enabled: true },
      });
      if (!rule) {
        throw new OperationalActionApplicationError('Rule not found or already paused', 409);
      }
      await prisma.automationRule.update({
        where: { id: p.ruleId },
        data: { enabled: false },
      });
      break;
    }
    case 'RECORD_GOAL_CONTRIBUTION': {
      const p = loaded.proposal.payload as { goalId: string; suggestedAmount: number };
      const goal = await prisma.operationalGoal.findFirst({
        where: { id: p.goalId, userId: input.userId, status: OperationalGoalStatus.ACTIVE },
      });
      if (!goal) {
        throw new OperationalActionApplicationError('Goal not active', 409);
      }
      await recordGoalContribution({
        userId: input.userId,
        goalId: p.goalId,
        amount: p.suggestedAmount,
        note: 'Applied from operational action engine (user-approved)',
      });
      break;
    }
    case 'SHIFT_RECURRING_BILL_DATE': {
      const p = loaded.proposal.payload as {
        billId: string;
        previousDate: string;
        proposedDate: string;
      };
      const bill = await prisma.recurringBill.findFirst({
        where: { id: p.billId, userId: input.userId, enabled: true },
      });
      if (!bill) {
        throw new OperationalActionApplicationError('Recurring bill not found or disabled', 409);
      }
      const prevDay = startOfDay(bill.nextDueDate).toISOString().slice(0, 10);
      const expectedPrev = startOfDay(new Date(p.previousDate)).toISOString().slice(0, 10);
      if (prevDay !== expectedPrev) {
        throw new OperationalActionApplicationError('Recurring bill due date changed since this proposal was built', 409);
      }
      await prisma.recurringBill.update({
        where: { id: p.billId },
        data: { nextDueDate: new Date(p.proposedDate) },
      });
      break;
    }
    case 'PREPARE_RESERVE_FOR_OBLIGATION': {
      const p = loaded.proposal.payload as { goalId: string };
      const goal = await prisma.operationalGoal.findFirst({
        where: { id: p.goalId, userId: input.userId, status: OperationalGoalStatus.ACTIVE },
        select: { id: true },
      });
      if (!goal) {
        throw new OperationalActionApplicationError('Reserve goal not active', 409);
      }
      // Apply writes only the FinancialEvent (handled below). No money moves.
      break;
    }
    case 'EXTEND_GOAL_TARGET_DATE': {
      const p = loaded.proposal.payload as {
        goalId: string;
        previousTargetDate: string;
        proposedTargetDate: string;
      };
      const goal = await prisma.operationalGoal.findFirst({
        where: { id: p.goalId, userId: input.userId, status: OperationalGoalStatus.ACTIVE },
      });
      if (!goal?.targetDate) {
        throw new OperationalActionApplicationError('Goal has no target date to extend', 409);
      }
      const prevDay = startOfDay(goal.targetDate).toISOString().slice(0, 10);
      const expectedPrev = startOfDay(new Date(p.previousTargetDate)).toISOString().slice(0, 10);
      if (prevDay !== expectedPrev) {
        throw new OperationalActionApplicationError('Goal target date changed since this proposal was built', 409);
      }
      await prisma.operationalGoal.update({
        where: { id: p.goalId },
        data: { targetDate: new Date(p.proposedTargetDate) },
      });
      await createFinancialEventSafe({
        userId: input.userId,
        type: FinancialEventType.GOAL_UPDATED,
        source: FinancialEventSource.API_GOALS,
        relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
        relatedEntityId: p.goalId,
        metadata: { fields: ['targetDate'], source: 'operational_action_engine' },
      });
      break;
    }
    default:
      throw new OperationalActionApplicationError('Unsupported action kind', 400);
  }

  const forecastAfter = await buildCashFlowForecast(input.userId, { includeDetails: false });
  const summaryBefore = summarizeForecast(forecastBefore);
  const summaryAfter = summarizeForecast(forecastAfter);

  await createFinancialEventSafe({
    userId: input.userId,
    type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
    source: FinancialEventSource.API_AUTOMATION,
    relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
    relatedEntityId: input.notificationId,
    metadata: {
      kind,
      payload: loaded.proposal.payload,
      forecastBeforeAt: forecastBefore.generatedAt,
      forecastAfterAt: forecastAfter.generatedAt,
      forecastSummaryBefore: summaryBefore,
      forecastSummaryAfter: summaryAfter,
    },
  });

  const notif = await prisma.automationNotification.findFirst({
    where: { id: input.notificationId, userId: input.userId },
    select: { metadata: true },
  });
  const prevProposal = notif ? readOperationalProposal(notif.metadata) : null;
  if (prevProposal) {
    const nextProposal = { ...prevProposal, status: 'applied' as const };
    const md = mergeNotificationMetadata(notif!.metadata, {
      operationalActionProposal: nextProposal,
      appliedAt: new Date().toISOString(),
    });
    await prisma.automationNotification.update({
      where: { id: input.notificationId },
      data: {
        readAt: new Date(),
        type: AutomationNotificationType.AUTOMATION_ACTION,
        metadata: md as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return {
    ok: true,
    kind,
    forecastSummaryBefore: summaryBefore,
    forecastSummaryAfter: summaryAfter,
  };
}
