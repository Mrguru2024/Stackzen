import { NextResponse } from 'next/server';
import { FinancialEntityType } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { ensureOperationalAttentionNotifications } from '@/lib/operational-notifications/ensure-attention';
import { ensureCashflowAttentionNotifications } from '@/lib/cashflow/ensure-cashflow-attention';
import { ensureGoalPlanningAttentionNotifications } from '@/lib/goals/ensure-goal-attention';
import { ensureGuidanceAttentionNotifications } from '@/lib/guidance/ensure-guidance-notifications';
import { ensureBankConnectivityAttentionNotifications } from '@/lib/bank/ensure-connectivity-attention';
import { ensureIncomeIntelligenceAttentionNotifications } from '@/lib/income-intelligence/ensure-attention';
import { ensureOperationalActionProposals } from '@/lib/operational-actions/ensure-proposals';
import { ensureContractorOperationalAttentionNotifications } from '@/lib/contractor-operations/ensure-attention';
import { ensureReserveAllocationAttentionNotifications } from '@/lib/reserve-allocation-intelligence/ensure-attention';
import { buildReserveAndContractorIntelligenceBundle } from '@/lib/reserve-allocation-intelligence/snapshot';
import { ensureTimingCoordinationAttentionNotifications } from '@/lib/timing-coordination/ensure-attention';
import {
  buildOperationalAlertDto,
  correlateLatestFinancialEvents,
} from '@/lib/operational-notifications/enrich';
import type { OperationalUiDomain } from '@/lib/operational-notifications/types';
import { reconcileDerivedOperationalAttention } from '@/lib/operational-state/reconcile-derived-attention';
import { runOperationalIntegrityScan } from '@/lib/operational-integrity/run-operational-integrity';
import { dedupeOperationalAlerts } from '@/lib/workspace/priority-engine';
import { buildWorkflowResolutionSnapshot } from '@/lib/workflow-resolution/snapshot';
import { listPendingOperationalProposals } from '@/lib/operational-actions/list-pending';
import { buildUnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center';
import type { ReserveAndContractorIntelligenceBundle } from '@/lib/reserve-allocation-intelligence/snapshot';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const ensure = url.searchParams.get('ensure') !== 'false';
  const integrityParam = url.searchParams.get('integrity');
  const includeCommandCenter = url.searchParams.get('includeCommandCenter') === 'true';

  let reserveContractorBundle: ReserveAndContractorIntelligenceBundle | null = null;

  if (ensure) {
    await ensureOperationalAttentionNotifications(session.user.id);
    reserveContractorBundle = await buildReserveAndContractorIntelligenceBundle(session.user.id);
    await ensureContractorOperationalAttentionNotifications(
      session.user.id,
      reserveContractorBundle.contractor
    );
    await ensureBankConnectivityAttentionNotifications(session.user.id);
    await ensureIncomeIntelligenceAttentionNotifications(session.user.id);
    await ensureCashflowAttentionNotifications(session.user.id);
    await ensureGoalPlanningAttentionNotifications(session.user.id);
    await ensureGuidanceAttentionNotifications(session.user.id);
    await ensureOperationalActionProposals(session.user.id);
    await ensureReserveAllocationAttentionNotifications(session.user.id, reserveContractorBundle.reserve);
    await ensureTimingCoordinationAttentionNotifications(session.user.id, reserveContractorBundle.timing);
  }

  if (includeCommandCenter && !reserveContractorBundle) {
    reserveContractorBundle = await buildReserveAndContractorIntelligenceBundle(session.user.id);
  }

  let integrityResult: Awaited<ReturnType<typeof runOperationalIntegrityScan>> | null = null;
  if (integrityParam === 'detect') {
    integrityResult = await runOperationalIntegrityScan(session.user.id, { mode: 'detect' });
  } else if (integrityParam === 'repair_safe') {
    integrityResult = await runOperationalIntegrityScan(session.user.id, { mode: 'repair_safe' });
  }

  if (ensure || integrityParam === 'repair_safe') {
    const { autoResolvedCount } = await reconcileDerivedOperationalAttention(session.user.id);
    if (integrityResult) {
      integrityResult = { ...integrityResult, derivedAttentionAutoResolved: autoResolvedCount };
    }
  }

  const rows = await prisma.automationNotification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  const recentEvents = await prisma.financialEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 250,
  });

  const correlation = correlateLatestFinancialEvents(recentEvents);
  const auditByNotificationId = new Map<string, typeof recentEvents>();
  for (const e of recentEvents) {
    if (e.relatedEntityType !== FinancialEntityType.AUTOMATION_NOTIFICATION || !e.relatedEntityId) continue;
    const list = auditByNotificationId.get(e.relatedEntityId) ?? [];
    if (list.length < 10) list.push(e);
    auditByNotificationId.set(e.relatedEntityId, list);
  }

  const now = Date.now();
  const rawAlerts = rows.map(r =>
    buildOperationalAlertDto(r, correlation, now, auditByNotificationId.get(r.id) ?? [])
  );

  // Server-side dedupe so non-workspace consumers (badges, counts, third-party API)
  // never see double-counts for the same risk (e.g. cashflow_<code> + guidance_<key>
  // both pointing at the same risk:CODE). Uses the same priority engine the workspace
  // UI uses — guidance wins on tie due to richer structured metadata.
  const alerts = dedupeOperationalAlerts(rawAlerts);

  const grouped: Record<OperationalUiDomain, typeof alerts> = {
    financial: [],
    automation: [],
    work: [],
    invoice: [],
    billing: [],
    goals: [],
    guidance: [],
  };

  for (const a of alerts) {
    grouped[a.domain].push(a);
  }

  let commandCenter: ReturnType<typeof buildUnifiedOperationalCommandCenterDto> | undefined;
  if (includeCommandCenter && reserveContractorBundle) {
    const [workflow, pendingProposals] = await Promise.all([
      buildWorkflowResolutionSnapshot(session.user.id, { windowDays: 14 }),
      listPendingOperationalProposals(session.user.id),
    ]);
    commandCenter = buildUnifiedOperationalCommandCenterDto({
      bundle: reserveContractorBundle,
      workflow,
      pendingProposals,
    });
  }

  return NextResponse.json({
    alerts,
    grouped,
    ...(commandCenter ? { commandCenter } : {}),
    ...(integrityResult ? { operationalIntegrity: integrityResult } : {}),
  });
}
