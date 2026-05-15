import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { DERIVED_GOAL_NOTIFICATION_TYPES } from '@/lib/goals/constants';
import { mergeNotificationMetadata, readAttentionKindFromMetadata } from '@/lib/operational-integrity/metadata';
import type {
  OperationalIntegrityRepairRecord,
  OperationalIntegrityViolation,
} from '@/lib/operational-integrity/types';
import { isDismissed, isSnoozedActive } from '@/lib/operational-notifications/helpers';

async function markNotificationIntegrityResolved(
  userId: string,
  notificationId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const n = await prisma.automationNotification.findFirst({
    where: { id: notificationId, userId },
    select: { metadata: true },
  });
  if (!n) return;
  const md = mergeNotificationMetadata(n.metadata, {
    ...patch,
    integrityRepairAt: new Date().toISOString(),
  });
  await prisma.automationNotification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
      metadata: md as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Collapses duplicate unread rows sharing an attentionKind (keeps newest by createdAt).
 */
export async function repairDuplicateUnreadAttentionKinds(userId: string): Promise<OperationalIntegrityRepairRecord[]> {
  const rows = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 320,
  });
  const now = Date.now();
  const byKind = new Map<string, typeof rows>();
  for (const r of rows) {
    if (isDismissed(r.metadata) || isSnoozedActive(r.metadata, now)) continue;
    const ak = readAttentionKindFromMetadata(r.metadata);
    if (!ak) continue;
    const list = byKind.get(ak) ?? [];
    list.push(r);
    byKind.set(ak, list);
  }

  const repairs: OperationalIntegrityRepairRecord[] = [];
  for (const [kind, list] of byKind) {
    if (list.length <= 1) continue;
    const [keep, ...dupes] = list;
    for (const d of dupes) {
      await markNotificationIntegrityResolved(userId, d.id, {
        integrityRepairCode: 'COLLAPSE_DUPLICATE_ATTENTION_KIND',
        integrityRepairReason: `Duplicate unread attentionKind "${kind}"; retained notification ${keep.id}.`,
      });
      await createFinancialEventSafe({
        userId,
        type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: d.id,
        metadata: {
          attentionKind: kind,
          reason: 'integrity_duplicate_attention_collapsed',
          retainedNotificationId: keep.id,
        },
      });
      repairs.push({
        code: 'COLLAPSE_DUPLICATE_ATTENTION_KIND',
        summary: `Collapsed duplicate unread attention: ${kind}`,
        explain: [
          `Retained newest notification ${keep.id}.`,
          `Marked ${d.id} read with auditable integrity metadata.`,
        ],
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: d.id,
        before: { readAt: null },
        after: { readAt: new Date().toISOString(), retainedNotificationId: keep.id },
      });
    }
  }
  return repairs;
}

export async function repairOrphanAndStaleGoalAttention(userId: string): Promise<OperationalIntegrityRepairRecord[]> {
  const rows = await prisma.automationNotification.findMany({
    where: {
      userId,
      readAt: null,
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: { not: null },
    },
    take: 220,
  });
  const now = Date.now();
  const repairs: OperationalIntegrityRepairRecord[] = [];

  for (const n of rows) {
    if (isDismissed(n.metadata) || isSnoozedActive(n.metadata, now)) continue;
    if (!n.relatedEntityId) continue;

    const goal = await prisma.operationalGoal.findFirst({
      where: { id: n.relatedEntityId, userId },
      select: { id: true, status: true, name: true },
    });

    if (!goal) {
      await markNotificationIntegrityResolved(userId, n.id, {
        integrityRepairCode: 'ORPHAN_GOAL_ATTENTION_CLEARED',
        integrityRepairReason: 'Linked operational goal no longer exists.',
      });
      await createFinancialEventSafe({
        userId,
        type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: n.id,
        metadata: { reason: 'integrity_orphan_goal_attention' },
      });
      repairs.push({
        code: 'ORPHAN_GOAL_ATTENTION_CLEARED',
        summary: 'Cleared orphan goal-linked attention',
        explain: ['Goal id missing; notification marked read with integrity metadata.'],
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: n.id,
      });
      continue;
    }

    if (
      goal.status !== OperationalGoalStatus.ACTIVE &&
      DERIVED_GOAL_NOTIFICATION_TYPES.has(n.type as AutomationNotificationType)
    ) {
      await markNotificationIntegrityResolved(userId, n.id, {
        integrityRepairCode: 'STALE_NONACTIVE_GOAL_ATTENTION_CLEARED',
        integrityRepairReason: `Goal "${goal.name}" is ${goal.status}; derived planning attention retired.`,
      });
      await createFinancialEventSafe({
        userId,
        type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: n.id,
        metadata: {
          reason: 'integrity_stale_nonactive_goal_attention',
          goalId: goal.id,
          goalStatus: goal.status,
        },
      });
      repairs.push({
        code: 'STALE_NONACTIVE_GOAL_ATTENTION_CLEARED',
        summary: `Retired derived goal attention for ${goal.status} goal`,
        explain: [`Goal ${goal.id} is not ACTIVE; derived notification ${n.id} marked read.`],
        relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
        relatedEntityId: goal.id,
      });
    }
  }

  return repairs;
}

/**
 * Sets SmartBucket.currentAmount to the rounded sum of SmartAllocation rows for that bucket (ACTIVE goals only).
 */
export async function repairGoalBucketTotalsFromAllocations(
  userId: string,
  violations: OperationalIntegrityViolation[]
): Promise<OperationalIntegrityRepairRecord[]> {
  const targets = violations.filter(v => v.code === 'GOAL_BUCKET_ALLOCATION_TOTAL_MISMATCH' && v.relatedEntityId);
  const repairs: OperationalIntegrityRepairRecord[] = [];

  for (const v of targets) {
    const goalId = v.relatedEntityId!;
    const goal = await prisma.operationalGoal.findFirst({
      where: { id: goalId, userId, status: OperationalGoalStatus.ACTIVE },
      include: { smartBucket: true },
    });
    if (!goal) continue;

    const agg = await prisma.smartAllocation.aggregate({
      where: { userId, bucketId: goal.smartBucketId },
      _sum: { amount: true },
    });
    const next = Number((agg._sum.amount ?? 0).toFixed(2));
    const prev = Number(goal.smartBucket.currentAmount.toFixed(2));
    if (Math.abs(next - prev) <= 0.02) continue;

    await prisma.$transaction(async tx => {
      await tx.smartBucket.update({
        where: { id: goal.smartBucketId, userId },
        data: { currentAmount: next },
      });
    });

    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.GOAL_UPDATED,
      source: FinancialEventSource.API_AUTOMATION,
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: goal.id,
      metadata: {
        integrityRepair: true,
        repairCode: 'GOAL_BUCKET_TOTAL_REALIGNED_TO_ALLOCATIONS',
        bucketId: goal.smartBucketId,
        previousBucketBalance: prev,
        nextBucketBalance: next,
        explain: [
          'SmartBucket.currentAmount was realigned to the sum of SmartAllocation.amount for this bucket.',
          'This is the canonical allocation ledger for goal contributions in StackZen.',
        ],
      },
    });

    repairs.push({
      code: 'GOAL_BUCKET_TOTAL_REALIGNED_TO_ALLOCATIONS',
      summary: `Realigned bucket balance for goal "${goal.name}"`,
      explain: [
        'Set SmartBucket.currentAmount from sum(SmartAllocation) for user-owned rows on this bucketId.',
        'Emitted GOAL_UPDATED with integrityRepair metadata for audit.',
      ],
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: goal.id,
      before: { bucketCurrentAmount: prev },
      after: { bucketCurrentAmount: next, bucketId: goal.smartBucketId },
    });
  }

  return repairs;
}
