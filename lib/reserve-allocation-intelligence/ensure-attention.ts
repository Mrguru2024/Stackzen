import type { Prisma } from '@prisma/client';
import { AutomationNotificationType, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import {
  buildOperationalAttentionMetadata,
  type AutomationClientAction,
} from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import {
  buildReserveAllocationSnapshot,
  isElevatedReservePressure,
} from '@/lib/reserve-allocation-intelligence/snapshot';
import type { ReserveAllocationSnapshotDto } from '@/lib/reserve-allocation-intelligence/types';

const KIND_ELEVATED = 'reserve_alloc_ops_elevated_pressure';
const MAX_GOAL_ACTIONS = 2;

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

/**
 * Build the ordered action list for the elevated notification.
 *
 * - Up to 2 `OPEN_OPERATIONAL_GOAL { goalId }` actions for the most under-filled
 *   reserve goals (deterministic from `selectTopUnderfilledReserveGoals`).
 * - Followed by Cash Flow + Money Control deep links.
 * - `CREATE_GOAL` is appended **only when** no under-filled goals exist (avoids
 *   nudging the user to create a new goal when an existing one needs attention).
 */
function buildElevatedActions(snap: ReserveAllocationSnapshotDto): AutomationClientAction[] {
  const actions: AutomationClientAction[] = [];

  for (const g of snap.topUnderfilledReserveGoals.slice(0, MAX_GOAL_ACTIONS)) {
    actions.push({ type: 'OPEN_OPERATIONAL_GOAL', goalId: g.goalId });
  }

  actions.push({ type: 'OPEN_CASH_FLOW' });
  actions.push({ type: 'OPEN_MONEY_CONTROL', tab: 'rules' });
  actions.push({ type: 'OPEN_MONEY_CONTROL', tab: 'buckets' });

  if (snap.topUnderfilledReserveGoals.length === 0) {
    actions.push({ type: 'CREATE_GOAL' });
  }

  return actions;
}

/**
 * Portfolio-level reserve / allocation pressure (does not auto-change rules or move funds).
 */
export async function ensureReserveAllocationAttentionNotifications(
  userId: string,
  cached?: ReserveAllocationSnapshotDto
): Promise<void> {
  const snap = cached ?? (await buildReserveAllocationSnapshot(userId));
  const hasCritical = snap.factors.some(f => f.code === 'PROJECTED_LOW_BALANCE_CRITICAL');
  const elevated = isElevatedReservePressure({
    factorsLen: snap.pressureScore,
    hasCriticalLowBalance: hasCritical,
  });

  if (!elevated) {
    const existing = await findExisting(userId);
    if (existing && !existing.readAt) {
      await markRead(userId, existing.id, 'reserve_alloc_ops_pressure_normalized');
    }
    return;
  }

  const topFactors = snap.factors.slice(0, 5).map(f => f.code);
  const title = 'Reserve & allocation · elevated operational pressure';
  const body = `Pressure factor count: ${snap.pressureScore}. Top signals: ${topFactors.join(', ') || 'n/a'}. Review rules and reserve goals — nothing auto-applies.`;

  const meta = buildOperationalAttentionMetadata(buildElevatedActions(snap), {
    attentionKind: KIND_ELEVATED,
    trust: {
      why: 'Multiple deterministic reserve/allocation stress checks fired in the same snapshot.',
      whatChanged: topFactors.join(' · '),
      recommendedNextStep:
        'Use Money Control to preview allocation changes, then Goals / operational actions for explicit approvals.',
      sourceEventType: 'RESERVE_ALLOC_OPS_PRESSURE',
    },
  }) as Record<string, unknown>;
  meta.reserveAllocationIntel = {
    score: snap.pressureScore,
    factorCodes: snap.factors.map(f => f.code),
    underfilledReserveGoalIds: snap.topUnderfilledReserveGoals.map(g => g.goalId),
    discretionaryShare: snap.discretionaryOutflowStats.discretionaryShare,
    enabledSavingsRuleCount: snap.savingsRulesContext.enabledCount,
    generatedAt: snap.generatedAt,
  };

  const severity =
    hasCritical || snap.pressureScore >= 7 ? NotificationSeverity.CRITICAL : NotificationSeverity.WARNING;

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
