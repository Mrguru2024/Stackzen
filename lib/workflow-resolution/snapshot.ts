import { addDays } from 'date-fns';
import { FinancialEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isInAttentionQueue } from '@/lib/operational-notifications/helpers';
import {
  aggregateAppliedActions,
  aggregateGoalContributions,
  buildOpenAttentionState,
  buildResolutionMomentumFactors,
  clampWindowDays,
  countActivationMilestones,
  countAttentionAutoResolved,
  countDismissedActions,
  countRecommendationsIssued,
} from '@/lib/workflow-resolution/aggregate';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';

const TRACKED_EVENT_TYPES = [
  FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
  FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
  FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE,
  FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
  FinancialEventType.GOAL_MILESTONE_REACHED,
];

const NOTIFICATION_SCAN_LIMIT = 250;

export async function buildWorkflowResolutionSnapshot(
  userId: string,
  opts?: { windowDays?: number }
): Promise<WorkflowResolutionSnapshotDto> {
  const windowDays = clampWindowDays(opts?.windowDays, 14);
  const now = new Date();
  const since = addDays(now, -windowDays);

  const [events, notifications] = await Promise.all([
    prisma.financialEvent.findMany({
      where: {
        userId,
        createdAt: { gte: since },
        type: { in: TRACKED_EVENT_TYPES },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.automationNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: NOTIFICATION_SCAN_LIMIT,
      select: { id: true, createdAt: true, readAt: true, metadata: true },
    }),
  ]);

  const appliedActions = aggregateAppliedActions(events);
  const goalContributions = aggregateGoalContributions(events);
  const attentionAutoResolvedInWindow = countAttentionAutoResolved(events);
  const activationMilestonesInWindow = countActivationMilestones(events);
  const recommendationsIssuedInWindow = countRecommendationsIssued(notifications, since.getTime());
  const dismissedActionCount = countDismissedActions(notifications, since.getTime());

  const queueSize = notifications.filter(n => isInAttentionQueue({ readAt: n.readAt, metadata: n.metadata })).length;
  const openAttention = buildOpenAttentionState(notifications, queueSize, now);

  const factors = buildResolutionMomentumFactors({
    appliedActions,
    attentionAutoResolved: attentionAutoResolvedInWindow,
    goalContributions,
    activationMilestonesInWindow,
    windowDays,
  });

  const explain = {
    assumptions: [
      'Window is a calendar-day range ending now; all timestamps use UTC-based JavaScript Date math.',
      'momentumFactorCount is the number of follow-through factor codes that fired in window, not a subjective health score.',
      'Applied actions, auto-resolved attention, goal contributions, milestones, and activation milestones are read directly from FinancialEvent (canonical operational audit source).',
      'Dismissed actions are derived from AutomationNotification.metadata.dismissedAt to avoid duplicating event types.',
      'Open attention queue uses the same isInAttentionQueue helper as the rest of the operational workspace.',
      'Balance delta per applied action is taken from FinancialEvent.metadata.forecastSummaryBefore/After of the latest event of that kind in window; events written before this persistence upgrade leave the delta null.',
    ],
    inputsUsed: {
      windowDays,
      eventRowsScanned: events.length,
      notificationRowsScanned: notifications.length,
      trackedEventTypeCount: TRACKED_EVENT_TYPES.length,
      momentumFactorCount: factors.length,
    },
  };

  return {
    generatedAt: now.toISOString(),
    windowDays,
    momentumFactorCount: factors.length,
    factors,
    appliedActions,
    dismissedActionCount,
    recommendationsIssuedInWindow,
    attentionAutoResolvedInWindow,
    goalContributions,
    activationMilestonesInWindow,
    openAttention,
    explain,
  };
}
