import type { Prisma } from '@prisma/client';
import { AutomationNotificationType, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import {
  buildOperationalAttentionMetadata,
  type AutomationClientAction,
} from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { buildTimingCoordinationSnapshot } from '@/lib/timing-coordination/snapshot';
import { isElevatedTimingPressure } from '@/lib/timing-coordination/pressure';
import type { TimingCoordinationSnapshotDto } from '@/lib/timing-coordination/types';

const KIND_ELEVATED = 'timing_obligation_cluster_dense';

function findExisting(userId: string) {
  return prisma.automationNotification.findFirst({
    where: {
      userId,
      metadata: { path: ['attentionKind'], equals: KIND_ELEVATED },
    },
    select: { id: true, readAt: true, metadata: true },
  });
}

async function markRead(userId: string, id: string, reason: string): Promise<void> {
  const row = await prisma.automationNotification.findFirst({
    where: { id, userId },
    select: { metadata: true },
  });
  if (!row) return;
  const md = mergeNotificationMetadata(row.metadata, {
    autoResolvedAt: new Date().toISOString(),
    autoResolvedReason: reason,
  });
  await prisma.automationNotification.update({
    where: { id },
    data: { readAt: new Date(), metadata: md as unknown as Prisma.InputJsonValue },
  });
}

function buildActions(snap: TimingCoordinationSnapshotDto): AutomationClientAction[] {
  const actions: AutomationClientAction[] = [];
  for (const goal of snap.reservePrepGoals.slice(0, 2)) {
    actions.push({ type: 'OPEN_OPERATIONAL_GOAL', goalId: goal.goalId });
  }
  actions.push({ type: 'OPEN_CASH_FLOW' });
  actions.push({ type: 'OPEN_MONEY_CONTROL', tab: 'rules' });
  return actions;
}

/**
 * Idempotent attention for elevated timing pressure. Re-runs the snapshot when
 * no cached value is passed; otherwise reuses the bundle's snapshot.
 */
export async function ensureTimingCoordinationAttentionNotifications(
  userId: string,
  cached?: TimingCoordinationSnapshotDto
): Promise<void> {
  const snap = cached ?? (await buildTimingCoordinationSnapshot(userId));
  const hasDenseCluster = snap.clusters.some(c => c.dense);
  const hasReservePrepBehind = snap.reservePrepGoals.length > 0;
  const elevated = isElevatedTimingPressure({
    factorsLen: snap.pressureScore,
    hasDenseCluster,
    hasReservePrepBehind,
  });

  if (!elevated) {
    const existing = await findExisting(userId);
    if (existing && !existing.readAt) {
      await markRead(userId, existing.id, 'timing_pressure_normalized');
    }
    return;
  }

  const topCluster = snap.clusters[0];
  const topConflict = snap.conflicts[0];
  const topFactors = snap.factors.slice(0, 5).map(f => f.code);
  const title = 'Timing coordination · elevated pressure';
  const body =
    topCluster
      ? `Cluster ${topCluster.startDate}–${topCluster.endDate} totals $${topCluster.totalAmountUsd.toFixed(2)} (${topCluster.events.length} events). Pressure factors: ${topFactors.join(', ')}.`
      : topConflict
        ? `Payout/bill conflict on ${topConflict.date} of $${topConflict.deficitUsd.toFixed(2)}. Pressure factors: ${topFactors.join(', ')}.`
        : `Pressure factor count: ${snap.pressureScore}. Factors: ${topFactors.join(', ')}.`;

  const meta = buildOperationalAttentionMetadata(buildActions(snap), {
    attentionKind: KIND_ELEVATED,
    trust: {
      why: 'Multiple deterministic timing stress checks fired in the same snapshot.',
      whatChanged: topFactors.join(' · '),
      recommendedNextStep:
        'Open Cash flow to inspect cluster days; preview a SHIFT_RECURRING_BILL_DATE proposal from the calendar; prepare reserves explicitly through operational actions.',
      sourceEventType: 'TIMING_COORDINATION_PRESSURE',
    },
  }) as Record<string, unknown>;
  meta.timingCoordination = {
    score: snap.pressureScore,
    factorCodes: snap.factors.map(f => f.code),
    clusterIds: snap.clusters.map(c => c.id),
    denseClusterIds: snap.clusters.filter(c => c.dense).map(c => c.id),
    conflictDates: snap.conflicts.map(c => c.date),
    reservePrepGoalIds: snap.reservePrepGoals.map(g => g.goalId),
    generatedAt: snap.generatedAt,
  };

  const severity =
    hasDenseCluster || snap.pressureScore >= 5
      ? NotificationSeverity.CRITICAL
      : NotificationSeverity.WARNING;

  const existing = await findExisting(userId);
  if (existing) {
    await prisma.automationNotification.update({
      where: { id: existing.id },
      data: {
        type: AutomationNotificationType.AUTOMATION_ACTION,
        title,
        body,
        severity,
        readAt: null,
        metadata: meta as unknown as Prisma.InputJsonValue,
      },
    });
  } else {
    await createAutomationNotification({
      userId,
      type: AutomationNotificationType.AUTOMATION_ACTION,
      severity,
      title,
      body,
      metadata: meta as unknown as Prisma.InputJsonValue,
    });
  }
}
