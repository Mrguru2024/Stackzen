import type { OperationalActionListItemDto } from '@/lib/operational-actions/list-pending';
import type { OperationalActionKind } from '@/lib/operational-actions/types';
import { isElevatedReservePressure } from '@/lib/reserve-allocation-intelligence/snapshot';
import type { ReserveAndContractorIntelligenceBundle } from '@/lib/reserve-allocation-intelligence/snapshot';
import { isElevatedTimingPressure } from '@/lib/timing-coordination/pressure';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';
import type {
  UnifiedOperationalCommandCenterDto,
  UnifiedOperationalContinuationDto,
  OperationalSubsystemBand,
  UnifiedOperationalSubsystemRowDto,
} from '@/lib/operational-command-center/types';
import type {
  CommandCenterCtaLadderStep,
  OperationalExecutionHandoffDto,
  OperationalHandoffBand,
  OperationalHandoffSubsystem,
} from '@/lib/operational-execution-context/types';

export interface BuildUnifiedOperationalCommandCenterInput {
  bundle: ReserveAndContractorIntelligenceBundle;
  workflow: WorkflowResolutionSnapshotDto;
  pendingProposals: OperationalActionListItemDto[];
}

const SUBSYSTEM_HREF: Record<UnifiedOperationalSubsystemRowDto['key'], string> = {
  reserve: '/money-control?tab=rules',
  timing: '/operational-center/calendar',
  contractor: '/invoices',
  workflow: '/operational-center#operational-attention',
};

function reserveRow(bundle: ReserveAndContractorIntelligenceBundle): UnifiedOperationalSubsystemRowDto {
  const { reserve } = bundle;
  const hasCritical = reserve.factors.some(f => f.code === 'PROJECTED_LOW_BALANCE_CRITICAL');
  const elevated = isElevatedReservePressure({
    factorsLen: reserve.pressureScore,
    hasCriticalLowBalance: hasCritical,
  });
  let band: OperationalSubsystemBand = 'stabilizing';
  if (elevated) band = 'escalating';
  else if (reserve.pressureScore >= 2 || reserve.guidance.length > 0) band = 'coordination';

  const headline =
    band === 'escalating'
      ? 'Reserve & allocation pressure is elevated'
      : band === 'coordination'
        ? 'Reserve & allocation need coordination'
        : 'Reserve & allocation stable relative to thresholds';

  const detail =
    band === 'escalating'
      ? 'Critical low-balance signal and/or reserve factor count crossed the elevated threshold used by automation attention.'
      : band === 'coordination'
        ? 'Forecast-linked factors or guidance rows are present; review rules, buckets, or goals before pressure worsens.'
        : 'No elevated reserve pressure under current deterministic rules.';

  return {
    key: 'reserve',
    label: 'Reserve & allocation',
    band,
    headline,
    detail,
    href: SUBSYSTEM_HREF.reserve,
    inputsUsed: {
      pressureScore: reserve.pressureScore,
      guidanceCount: reserve.guidance.length,
      hasCriticalLowBalanceFactor: hasCritical,
      weeklyAllocationEstimateUsd: reserve.weeklyAllocationEstimateUsd,
    },
  };
}

function timingRow(bundle: ReserveAndContractorIntelligenceBundle): UnifiedOperationalSubsystemRowDto {
  const t = bundle.timing;
  const denseCluster = t.clusters.some(c => c.dense);
  const hasReservePrepBehind = t.reservePrepGoals.length > 0;
  const factorsLen = t.pressureScore;
  const elevated = isElevatedTimingPressure({
    factorsLen,
    hasDenseCluster: denseCluster,
    hasReservePrepBehind,
  });

  let band: OperationalSubsystemBand = 'stabilizing';
  if (elevated || t.conflicts.length > 0) band = 'escalating';
  else if (t.clusters.length > 0 || t.instabilityWindow != null) band = 'coordination';

  const headline =
    band === 'escalating'
      ? 'Timing pressure or payout conflict is elevated'
      : band === 'coordination'
        ? 'Timing coordination recommended'
        : 'No obligation timing escalation detected';

  const detail =
    band === 'escalating'
      ? 'Dense obligation cluster, reserve-prep overlap, elevated factor count, and/or a payout-vs-bill conflict in the 30-day window.'
      : band === 'coordination'
        ? 'Clusters or forecast instability present; use the timing calendar to propose bill shifts (user-approved only).'
        : 'Obligation timing signals are within normal bands for this forecast run.';

  return {
    key: 'timing',
    label: 'Timing',
    band,
    headline,
    detail,
    href: SUBSYSTEM_HREF.timing,
    inputsUsed: {
      pressureScore: t.pressureScore,
      clusterCount: t.clusters.length,
      conflictCount: t.conflicts.length,
      denseCluster,
      instabilityDays: t.instabilityWindow?.daysCount ?? null,
    },
  };
}

function contractorRow(bundle: ReserveAndContractorIntelligenceBundle): UnifiedOperationalSubsystemRowDto {
  const c = bundle.contractor;
  if (!c.hasContractorContext) {
    return {
      key: 'contractor',
      label: 'Contractor',
      band: 'stabilizing',
      headline: 'No contractor context',
      detail: 'No contractor-scoped jobs or receivables in scope for this snapshot.',
      href: SUBSYSTEM_HREF.contractor,
      inputsUsed: { hasContractorContext: false },
    };
  }

  const hasJobRisk =
    c.negativeMarginJobs.length > 0 || c.materialExposure.length > 0 || c.latePayerClients.length > 0;
  const hasCoordinationSurface = c.openReceivables.length > 0 || c.reserveNudges.length > 0;

  let band: OperationalSubsystemBand = 'stabilizing';
  if (hasJobRisk) band = 'escalating';
  else if (hasCoordinationSurface) band = 'coordination';

  const headline =
    band === 'escalating'
      ? 'Contractor financial exposure needs attention'
      : band === 'coordination'
        ? 'Contractor collections or reserves need coordination'
        : 'Contractor operations within normal operational bands';

  const detail =
    band === 'escalating'
      ? 'Negative margin jobs, material exposure, and/or late-payer concentration detected from job + invoice data.'
      : band === 'coordination'
        ? 'Open receivables and/or reserve nudges are present from the contractor snapshot.'
        : 'No contractor escalation flags in this snapshot.';

  return {
    key: 'contractor',
    label: 'Contractor',
    band,
    headline,
    detail,
    href: SUBSYSTEM_HREF.contractor,
    inputsUsed: {
      hasContractorContext: true,
      negativeMarginJobs: c.negativeMarginJobs.length,
      materialExposureJobs: c.materialExposure.length,
      latePayerClients: c.latePayerClients.length,
      openReceivables: c.openReceivables.length,
      reserveNudges: c.reserveNudges.length,
    },
  };
}

function workflowRow(
  workflow: WorkflowResolutionSnapshotDto,
  pendingCount: number
): UnifiedOperationalSubsystemRowDto {
  const { openAttention } = workflow;
  const age = openAttention.oldestPendingProposalAgeDays;
  const stale = age != null && age >= 7;
  const queueSize = openAttention.queueSize;

  let band: OperationalSubsystemBand = 'stabilizing';
  if (stale || queueSize >= 12) band = 'escalating';
  else if (pendingCount > 0 || queueSize > 0) band = 'coordination';

  const headline =
    band === 'escalating'
      ? 'Attention queue or proposals are aging'
      : band === 'coordination'
        ? 'Workflow continuation available'
        : 'Attention queue is quiet';

  const detail =
    band === 'escalating'
      ? 'Oldest pending operational proposal is ≥7 days old and/or the attention queue is ≥12 items — triage to reduce operational drag.'
      : band === 'coordination'
        ? 'Unread attention items and/or pending operational actions need explicit review or dismissal.'
        : 'No open operational proposals and limited unread attention under current thresholds.';

  return {
    key: 'workflow',
    label: 'Workflow & attention',
    band,
    headline,
    detail,
    href: SUBSYSTEM_HREF.workflow,
    inputsUsed: {
      queueSize,
      pendingOperationalActionsCount: pendingCount,
      oldestPendingProposalAgeDays: age,
    },
  };
}

function coordinationBulletForRow(
  row: UnifiedOperationalSubsystemRowDto,
  bundle: ReserveAndContractorIntelligenceBundle,
  workflow: WorkflowResolutionSnapshotDto,
  pendingCount: number
): string | null {
  if (row.band === 'stabilizing') return null;

  if (row.key === 'reserve') {
    const critical = row.inputsUsed.hasCriticalLowBalanceFactor === true;
    const ps = row.inputsUsed.pressureScore;
    return `Reserve: elevated attention (${typeof ps === 'number' ? `${ps} factor(s)` : 'factor count'}${critical ? '; PROJECTED_LOW_BALANCE_CRITICAL present' : ''}).`;
  }
  if (row.key === 'timing') {
    const cc = bundle.timing.conflicts.length;
    const elevated = isElevatedTimingPressure({
      factorsLen: bundle.timing.pressureScore,
      hasDenseCluster: bundle.timing.clusters.some(c => c.dense),
      hasReservePrepBehind: bundle.timing.reservePrepGoals.length > 0,
    });
    if (cc > 0) {
      return `Timing: ${cc} payout-vs-bill conflict day(s) in the obligation window${elevated ? '; timing pressure also elevated' : ''}.`;
    }
    return 'Timing: dense cluster, reserve-prep overlap, and/or factor count crossed the elevated timing threshold.';
  }
  if (row.key === 'contractor') {
    const nm = bundle.contractor.negativeMarginJobs.length;
    const mat = bundle.contractor.materialExposure.length;
    const late = bundle.contractor.latePayerClients.length;
    const parts: string[] = [];
    if (nm > 0) parts.push(`${nm} negative-margin job(s)`);
    if (mat > 0) parts.push(`${mat} material exposure row(s)`);
    if (late > 0) parts.push(`${late} late-payer client group(s)`);
    if (row.band === 'coordination') {
      return `Contractor: coordination surface — ${bundle.contractor.openReceivables.length} open receivable(s), ${bundle.contractor.reserveNudges.length} reserve nudge(s).`;
    }
    return `Contractor: escalation — ${parts.join('; ') || 'job/invoice risk flags'}.`;
  }
  if (row.key === 'workflow') {
    const q = workflow.openAttention.queueSize;
    const a = workflow.openAttention.oldestPendingProposalAgeDays;
    if (row.band === 'coordination') {
      return `Workflow: ${pendingCount} pending operational action(s) and ${q} unread attention item(s) (below stale/queue-size escalation thresholds).`;
    }
    if (a != null && a >= 7) {
      return `Workflow: oldest pending operational proposal is ${a} day(s) old (threshold ≥7).`;
    }
    if (q >= 12) {
      return `Workflow: attention queue size is ${q} (threshold ≥12).`;
    }
  }
  return null;
}

function buildCoordinationBullets(
  rows: UnifiedOperationalSubsystemRowDto[],
  bundle: ReserveAndContractorIntelligenceBundle,
  workflow: WorkflowResolutionSnapshotDto,
  pendingCount: number
): string[] {
  const out: string[] = [];

  for (const r of rows) {
    if (out.length >= 5) break;
    if (r.band !== 'escalating') continue;
    const b = coordinationBulletForRow(r, bundle, workflow, pendingCount);
    if (b) out.push(b);
  }

  for (const r of rows) {
    if (out.length >= 5) break;
    if (r.band !== 'coordination') continue;
    const b = coordinationBulletForRow(r, bundle, workflow, pendingCount);
    if (b) out.push(b);
  }

  if (out.length === 0) {
    const r = bundle.reserve;
    const t = bundle.timing;
    const c = bundle.contractor;
    const w = workflow.openAttention;
    out.push(
      `Reserve stable: pressureScore=${r.pressureScore}, guidanceRows=${r.guidance.length}, criticalLowBalanceFactor=${r.factors.some(f => f.code === 'PROJECTED_LOW_BALANCE_CRITICAL')}.`
    );
    if (out.length < 5) {
      out.push(
        `Timing stable: clusters=${t.clusters.length}, conflicts=${t.conflicts.length}, instabilityWindow=${t.instabilityWindow != null ? `${t.instabilityWindow.daysCount}d` : 'none'}.`
      );
    }
    if (out.length < 5) {
      out.push(
        c.hasContractorContext
          ? `Contractor stable: openReceivables=${c.openReceivables.length}, reserveNudges=${c.reserveNudges.length}, negativeMarginJobs=${c.negativeMarginJobs.length}.`
          : 'Contractor: no contractor context in this snapshot (jobs/receivables out of scope).'
      );
    }
    if (out.length < 5) {
      out.push(
        `Workflow stable: pendingProposals=${pendingCount}, attentionQueue=${w.queueSize}, oldestProposalAgeDays=${w.oldestPendingProposalAgeDays ?? 'n/a'}.`
      );
    }
  }

  return out.slice(0, 5);
}

function primaryContinuation(
  pending: OperationalActionListItemDto[],
  timingBand: OperationalSubsystemBand,
  reserveBand: OperationalSubsystemBand,
  contractorBand: OperationalSubsystemBand,
  workflowBand: OperationalSubsystemBand,
  queueSize: number
): UnifiedOperationalContinuationDto {
  const pendingCount = pending.length;
  const shiftPending = pending.filter(p => p.kind === 'SHIFT_RECURRING_BILL_DATE').length;

  const baseHandoff = (step: CommandCenterCtaLadderStep, sub?: OperationalHandoffSubsystem, band?: OperationalHandoffBand): OperationalExecutionHandoffDto => ({
    source: 'command_center',
    ctaLadderStep: step,
    focusSubsystem: sub,
    focusBand: band,
  });

  let primary: UnifiedOperationalContinuationDto['primaryCta'] = {
    href: '/cash-flow',
    label: 'Review cash flow forecast',
    reason: 'No higher-priority operational ladder step matched; default is the deterministic cash flow forecast.',
  };
  let executionHandoff = baseHandoff(6, undefined, undefined);

  if (pendingCount > 0) {
    primary = {
      href: '/operational-center#operational-actions',
      label: 'Preview pending operational actions',
      reason: 'Pending user-approved operational proposals exist.',
    };
    executionHandoff = baseHandoff(1, 'workflow', workflowBand);
  } else if (timingBand === 'escalating' || shiftPending > 0) {
    primary = {
      href: '/operational-center/calendar',
      label: 'Coordinate timing on the calendar',
      reason:
        shiftPending > 0
          ? 'Pending SHIFT_RECURRING_BILL_DATE proposal(s) require calendar coordination.'
          : 'Timing band is escalating (dense cluster, conflicts, or elevated factor count).',
    };
    executionHandoff = baseHandoff(2, 'timing', timingBand);
  } else if (reserveBand === 'escalating') {
    primary = {
      href: '/money-control?tab=rules',
      label: 'Adjust rules / buckets',
      reason: 'Reserve & allocation pressure crossed the elevated threshold.',
    };
    executionHandoff = baseHandoff(3, 'reserve', reserveBand);
  } else if (contractorBand === 'escalating') {
    primary = {
      href: '/invoices',
      label: 'Triage contractor receivables',
      reason: 'Contractor exposure signals (margin, materials, or late payers) are elevated.',
    };
    executionHandoff = baseHandoff(4, 'contractor', contractorBand);
  } else if (queueSize > 0) {
    primary = {
      href: '/operational-center#operational-attention',
      label: 'Review operational attention',
      reason: 'Unread operational notifications remain in the attention queue.',
    };
    executionHandoff = baseHandoff(5, 'workflow', workflowBand);
  }

  return {
    pendingOperationalActionsCount: pendingCount,
    pendingShiftBillProposalsCount: shiftPending,
    openAttentionQueueSize: queueSize,
    oldestPendingProposalAgeDays: null,
    primaryCta: primary,
    executionHandoff,
  };
}

export function buildUnifiedOperationalCommandCenterDto(
  input: BuildUnifiedOperationalCommandCenterInput
): UnifiedOperationalCommandCenterDto {
  const now = new Date().toISOString();
  const pending = input.pendingProposals;
  const rRow = reserveRow(input.bundle);
  const tRow = timingRow(input.bundle);
  const cRow = contractorRow(input.bundle);
  const wRow = workflowRow(input.workflow, pending.length);

  const rows = [rRow, tRow, cRow, wRow];
  const bullets = buildCoordinationBullets(rows, input.bundle, input.workflow, pending.length);

  const appliedKinds = input.workflow.appliedActions
    .filter(a => a.count > 0)
    .map(a => ({ kind: a.kind, count: a.count }));

  const continuation = primaryContinuation(
    pending,
    tRow.band,
    rRow.band,
    cRow.band,
    wRow.band,
    input.workflow.openAttention.queueSize
  );
  continuation.oldestPendingProposalAgeDays = input.workflow.openAttention.oldestPendingProposalAgeDays;

  return {
    generatedAt: now,
    coordinationBullets: bullets,
    subsystems: rows,
    stabilization: {
      momentumFactorCount: input.workflow.momentumFactorCount,
      momentumFactorCodes: input.workflow.factors.map(f => f.code),
      attentionAutoResolvedInWindow: input.workflow.attentionAutoResolvedInWindow,
      appliedActionKindsInWindow: appliedKinds as { kind: OperationalActionKind; count: number }[],
    },
    continuation,
    explain: {
      assumptions: [
        'Subsystem bands reuse existing helpers: isElevatedReservePressure, isElevatedTimingPressure, and deterministic contractor/job fields from the shared intelligence bundle.',
        'Workflow band thresholds: oldest pending operational proposal age ≥7 days OR attention queue ≥12 → escalating; pending proposals or any queue → coordination.',
        'Primary CTA ladder (first match): pending operational actions → timing escalation or pending shift proposals → reserve escalation → contractor escalation → attention queue → cash flow forecast.',
        'Stabilization metrics are copied only from WorkflowResolutionSnapshotDto — no new composite scores.',
      ],
      contributors: [
        'reserve-allocation-intelligence',
        'timing-coordination',
        'contractor-operations',
        'workflow-resolution',
        'operational-actions/list-pending',
      ],
    },
  };
}
