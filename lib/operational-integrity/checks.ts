import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  OperationalGoalStatus,
} from '@prisma/client';
import { addDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { MAX_TRANSACTION_ROWS, TRANSACTION_LOOKBACK_DAYS } from '@/lib/cashflow/constants';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { buildGuidanceRecommendations } from '@/lib/guidance/engine';
import { DERIVED_GOAL_NOTIFICATION_TYPES } from '@/lib/goals/constants';
import { readAttentionKindFromMetadata } from '@/lib/operational-integrity/metadata';
import type { OperationalIntegrityViolation } from '@/lib/operational-integrity/types';

const BUCKET_DRIFT_EPS = 0.02;

export async function checkLedgerForecastSampleCap(userId: string): Promise<OperationalIntegrityViolation[]> {
  const now = new Date();
  const lookback = addDays(now, -TRANSACTION_LOOKBACK_DAYS);
  const totalInWindow = await prisma.financialTransaction.count({
    where: { userId, postedAt: { gte: lookback } },
  });
  if (totalInWindow <= MAX_TRANSACTION_ROWS) return [];
  return [
    {
      code: 'LEDGER_FORECAST_SAMPLE_CAPPED',
      severity: 'warning',
      summary: 'Cash flow forecast uses a capped transaction sample',
      detail: `There are ${totalInWindow} ledger rows in the forecast lookback window, but the engine loads at most ${MAX_TRANSACTION_ROWS}. Recurrence detection and risk signals may omit older activity until rows age out.`,
      evidence: { totalInWindow, maxSample: MAX_TRANSACTION_ROWS, lookbackDays: TRANSACTION_LOOKBACK_DAYS },
    },
  ];
}

export async function checkGoalBucketAllocationTotals(userId: string): Promise<OperationalIntegrityViolation[]> {
  const goals = await prisma.operationalGoal.findMany({
    where: { userId, status: OperationalGoalStatus.ACTIVE },
    include: { smartBucket: true },
  });
  const out: OperationalIntegrityViolation[] = [];
  for (const g of goals) {
    const agg = await prisma.smartAllocation.aggregate({
      where: { userId, bucketId: g.smartBucketId },
      _sum: { amount: true },
    });
    const sumAlloc = Number((agg._sum.amount ?? 0).toFixed(2));
    const current = Number(g.smartBucket.currentAmount.toFixed(2));
    const drift = Math.abs(sumAlloc - current);
    if (drift > BUCKET_DRIFT_EPS) {
      out.push({
        code: 'GOAL_BUCKET_ALLOCATION_TOTAL_MISMATCH',
        severity: 'escalate',
        summary: `Goal bucket balance does not match allocation ledger for "${g.name}"`,
        detail:
          'Operational goal progress uses SmartBucket.currentAmount while contributions append SmartAllocation rows. These totals diverged beyond tolerance, which breaks deterministic goal pacing and explainability.',
        relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
        relatedEntityId: g.id,
        evidence: {
          bucketId: g.smartBucketId,
          smartAllocationSum: sumAlloc,
          bucketCurrentAmount: current,
          drift,
        },
      });
    }
  }
  return out;
}

export async function checkDuplicateUnreadAttentionKinds(userId: string): Promise<OperationalIntegrityViolation[]> {
  const rows = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 320,
    select: { id: true, metadata: true, createdAt: true },
  });
  const byKind = new Map<string, { id: string; createdAt: Date }[]>();
  for (const r of rows) {
    const ak = readAttentionKindFromMetadata(r.metadata);
    if (!ak) continue;
    const list = byKind.get(ak) ?? [];
    list.push({ id: r.id, createdAt: r.createdAt });
    byKind.set(ak, list);
  }
  const out: OperationalIntegrityViolation[] = [];
  for (const [kind, list] of byKind) {
    if (list.length <= 1) continue;
    out.push({
      code: 'DUPLICATE_UNREAD_OPERATIONAL_ATTENTION',
      severity: 'warning',
      summary: 'Duplicate unread operational attention rows share the same attentionKind',
      detail:
        'Multiple unread AutomationNotification rows reference the same deterministic attentionKind. The ensure pipeline is idempotent per kind; duplicates usually indicate races, manual inserts, or legacy data. Older duplicates should be retired deterministically.',
      evidence: { attentionKind: kind, duplicateIds: list.map(x => x.id), count: list.length },
    });
  }
  return out;
}

export async function checkOrphanOrStaleGoalAttention(userId: string): Promise<OperationalIntegrityViolation[]> {
  const rows = await prisma.automationNotification.findMany({
    where: {
      userId,
      readAt: null,
      relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
      relatedEntityId: { not: null },
    },
    take: 220,
    select: { id: true, relatedEntityId: true, type: true, metadata: true },
  });
  const out: OperationalIntegrityViolation[] = [];
  for (const r of rows) {
    if (!r.relatedEntityId) continue;
    const goal = await prisma.operationalGoal.findFirst({
      where: { id: r.relatedEntityId, userId },
      select: { id: true, status: true, name: true },
    });
    if (!goal) {
      out.push({
        code: 'ORPHAN_GOAL_ATTENTION_NOTIFICATION',
        severity: 'warning',
        summary: 'Operational attention references a missing goal',
        detail: 'Notification is linked to an operational goal id that no longer exists for this user.',
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: r.id,
        evidence: { staleGoalId: r.relatedEntityId },
      });
      continue;
    }
    if (
      goal.status !== OperationalGoalStatus.ACTIVE &&
      DERIVED_GOAL_NOTIFICATION_TYPES.has(r.type as AutomationNotificationType)
    ) {
      out.push({
        code: 'STALE_NONACTIVE_GOAL_ATTENTION',
        severity: 'info',
        summary: `Goal attention row is stale for non-active goal "${goal.name}"`,
        detail: `Goal status is ${goal.status}; derived planning notifications should not remain unread in the attention queue.`,
        relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
        relatedEntityId: goal.id,
        evidence: { notificationId: r.id, notificationType: r.type },
      });
    }
  }
  return out;
}

export async function checkGuidanceCashflowAlignment(userId: string): Promise<OperationalIntegrityViolation[]> {
  const [{ recommendations }, forecast] = await Promise.all([
    buildGuidanceRecommendations(userId),
    buildCashFlowForecast(userId, { includeDetails: false }),
  ]);
  const expectedGuidance = new Set(recommendations.map(x => `guidance_${x.attentionKey}`));
  const expectedCashflow = new Set(forecast.risks.map(x => `cashflow_${x.code.toLowerCase()}`));

  const rows = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 220,
    select: { id: true, metadata: true },
  });
  const out: OperationalIntegrityViolation[] = [];
  for (const r of rows) {
    const ak = readAttentionKindFromMetadata(r.metadata);
    if (!ak) continue;
    if (ak.startsWith('guidance_') && !expectedGuidance.has(ak)) {
      out.push({
        code: 'STALE_GUIDANCE_ATTENTION_ROW',
        severity: 'info',
        summary: 'Unread guidance attention row no longer produced by engine',
        detail:
          'Current guidance recommendations do not include this attentionKind. The derived-attention reconciler should retire it on the next operational pass; this finding is informational for drift monitoring.',
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: r.id,
        evidence: { attentionKind: ak },
      });
    }
    if (ak.startsWith('cashflow_') && !expectedCashflow.has(ak)) {
      out.push({
        code: 'STALE_CASHFLOW_ATTENTION_ROW',
        severity: 'info',
        summary: 'Unread cashflow attention row no longer matches forecast risks',
        detail:
          'Current deterministic forecast risks do not include this attentionKind. Reconciliation should clear it on the next pass.',
        relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
        relatedEntityId: r.id,
        evidence: { attentionKind: ak },
      });
    }
  }
  return out;
}

export async function runAllOperationalIntegrityChecks(userId: string): Promise<OperationalIntegrityViolation[]> {
  const chunks = await Promise.all([
    checkLedgerForecastSampleCap(userId),
    checkGoalBucketAllocationTotals(userId),
    checkDuplicateUnreadAttentionKinds(userId),
    checkOrphanOrStaleGoalAttention(userId),
    checkGuidanceCashflowAlignment(userId),
  ]);
  return chunks.flat();
}

export function violationFingerprint(v: OperationalIntegrityViolation): string {
  const rel = v.relatedEntityId ? `${v.relatedEntityType ?? ''}:${v.relatedEntityId}` : '';
  return `${v.code}|${rel}|${JSON.stringify(v.evidence ?? {})}`;
}
