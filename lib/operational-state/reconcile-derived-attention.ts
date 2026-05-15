import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  JobStatus,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { buildGuidanceRecommendations } from '@/lib/guidance/engine';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { fullGoalAttentionKind } from '@/lib/goals/ensure-goal-attention';
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import { DERIVED_GOAL_NOTIFICATION_TYPES } from '@/lib/goals/constants';
import { isDismissed, isSnoozedActive } from '@/lib/operational-notifications/helpers';

// Business attention kinds emitted by ensureOperationalAttentionNotifications.
// These are entity-linked (INVOICE / JOB relatedEntityId) and must be auto-resolved
// when the underlying entity state no longer warrants attention.
const BUSINESS_INVOICE_KINDS = new Set(['invoice_overdue', 'invoice_due_soon']);
const BUSINESS_JOB_KINDS = new Set(['job_deposit_required', 'job_awaiting_payment']);

type InvoiceSnap = { id: string; status: string };
type JobSnap = { id: string; status: JobStatus };

function readAttentionKind(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).attentionKind;
  return typeof v === 'string' ? v : null;
}

function deriveAutoResolveReason(
  n: { type: AutomationNotificationType; relatedEntityType: FinancialEntityType | null; relatedEntityId: string | null },
  ak: string,
  expectedGuidance: Set<string>,
  expectedCashflow: Set<string>,
  expectedGoalKindsByGoalId: Map<string, Set<string>>,
  invoiceById: Map<string, InvoiceSnap>,
  jobById: Map<string, JobSnap>
): string | null {
  if (ak.startsWith('guidance_')) {
    return expectedGuidance.has(ak) ? null : 'guidance_key_no_longer_recommended';
  }
  if (ak.startsWith('cashflow_')) {
    return expectedCashflow.has(ak) ? null : 'cashflow_risk_no_longer_present';
  }
  if (BUSINESS_INVOICE_KINDS.has(ak)) {
    if (n.relatedEntityType !== FinancialEntityType.INVOICE || !n.relatedEntityId) return null;
    const inv = invoiceById.get(n.relatedEntityId);
    if (!inv) return 'invoice_no_longer_accessible';
    if (inv.status === 'paid' || inv.status === 'failed') return 'invoice_resolved_status_change';
    return null;
  }
  if (BUSINESS_JOB_KINDS.has(ak)) {
    if (n.relatedEntityType !== FinancialEntityType.JOB || !n.relatedEntityId) return null;
    const job = jobById.get(n.relatedEntityId);
    if (!job) return 'job_no_longer_accessible';
    if (ak === 'job_deposit_required' && job.status !== JobStatus.DEPOSIT_PENDING) {
      return 'job_status_advanced_past_deposit_pending';
    }
    if (ak === 'job_awaiting_payment' && job.status !== JobStatus.AWAITING_PAYMENT) {
      return 'job_status_no_longer_awaiting_payment';
    }
    return null;
  }
  if (
    DERIVED_GOAL_NOTIFICATION_TYPES.has(n.type) &&
    n.relatedEntityType === FinancialEntityType.OPERATIONAL_GOAL &&
    n.relatedEntityId
  ) {
    const expected = expectedGoalKindsByGoalId.get(n.relatedEntityId);
    if (expected === undefined) return 'goal_no_longer_active_or_tracking_removed';
    if (!expected.has(ak)) return 'goal_analysis_no_longer_flags_this_finding';
  }
  return null;
}

/**
 * Marks engine-derived attention rows as read when the deterministic ensure pipeline
 * no longer emits the same attentionKind (guidance / cashflow / goal analysis).
 */
export async function reconcileDerivedOperationalAttention(userId: string): Promise<{ autoResolvedCount: number }> {
  const [{ recommendations }, forecast] = await Promise.all([
    buildGuidanceRecommendations(userId),
    buildCashFlowForecast(userId, { includeDetails: false }),
  ]);

  const expectedGuidance = new Set(recommendations.map(r => `guidance_${r.attentionKey}`));
  const expectedCashflow = new Set(forecast.risks.map(r => `cashflow_${r.code.toLowerCase()}`));

  const goals = await prisma.operationalGoal.findMany({
    where: { userId, status: OperationalGoalStatus.ACTIVE },
    include: { smartBucket: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  const expectedGoalKindsByGoalId = new Map<string, Set<string>>();
  for (const goal of goals) {
    const analysis = await analyzeOperationalGoal(userId, goal, { forecast });
    const s = new Set<string>();
    for (const f of analysis.findings) {
      s.add(fullGoalAttentionKind(goal.id, f));
    }
    expectedGoalKindsByGoalId.set(goal.id, s);
  }

  const candidates = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 220,
  });

  // Batch-fetch invoice/job snapshots referenced by business attention notifications.
  // This avoids one DB hit per candidate row.
  const invoiceIds = new Set<string>();
  const jobIds = new Set<string>();
  for (const c of candidates) {
    const ak = readAttentionKind(c.metadata);
    if (!ak || !c.relatedEntityId || !c.relatedEntityType) continue;
    if (BUSINESS_INVOICE_KINDS.has(ak) && c.relatedEntityType === FinancialEntityType.INVOICE) {
      invoiceIds.add(c.relatedEntityId);
    } else if (BUSINESS_JOB_KINDS.has(ak) && c.relatedEntityType === FinancialEntityType.JOB) {
      jobIds.add(c.relatedEntityId);
    }
  }

  const [invoices, jobs] = await Promise.all([
    invoiceIds.size > 0
      ? prisma.invoice.findMany({
          where: { id: { in: Array.from(invoiceIds) }, userId },
          select: { id: true, status: true },
        })
      : Promise.resolve([] as InvoiceSnap[]),
    jobIds.size > 0
      ? prisma.job.findMany({
          where: { id: { in: Array.from(jobIds) }, userId },
          select: { id: true, status: true },
        })
      : Promise.resolve([] as JobSnap[]),
  ]);

  const invoiceById = new Map<string, InvoiceSnap>(invoices.map(i => [i.id, i]));
  const jobById = new Map<string, JobSnap>(jobs.map(j => [j.id, j]));

  let autoResolvedCount = 0;
  const now = Date.now();

  for (const n of candidates) {
    if (isDismissed(n.metadata) || isSnoozedActive(n.metadata, now)) continue;
    const ak = readAttentionKind(n.metadata);
    if (!ak) continue;

    const reason = deriveAutoResolveReason(
      n,
      ak,
      expectedGuidance,
      expectedCashflow,
      expectedGoalKindsByGoalId,
      invoiceById,
      jobById
    );
    if (!reason) continue;

    const mdBase =
      n.metadata && typeof n.metadata === 'object' && !Array.isArray(n.metadata)
        ? ({ ...(n.metadata as Record<string, unknown>) } as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    mdBase.autoResolvedAt = new Date().toISOString();
    mdBase.autoResolvedReason = reason;

    await prisma.automationNotification.update({
      where: { id: n.id },
      data: {
        readAt: new Date(),
        metadata: mdBase as unknown as Prisma.InputJsonValue,
      },
    });

    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
      source: FinancialEventSource.API_AUTOMATION,
      relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
      relatedEntityId: n.id,
      metadata: { attentionKind: ak, reason },
    });

    autoResolvedCount += 1;
  }

  return { autoResolvedCount };
}
