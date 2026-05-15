import { differenceInCalendarDays } from 'date-fns';
import { FinancialEventType } from '@prisma/client';
import type { FinancialEvent } from '@prisma/client';
import { readAttentionKind, readOperationalProposal } from '@/lib/operational-actions/metadata';
import type { ForecastSummaryDto, OperationalActionKind } from '@/lib/operational-actions/types';
import type {
  AppliedActionAggregateDto,
  AppliedActionBalanceDeltaDto,
  GoalContributionAggregateDto,
  OpenAttentionStateDto,
  WorkflowResolutionMomentumFactorDto,
} from '@/lib/workflow-resolution/types';

const KNOWN_KINDS: OperationalActionKind[] = [
  'PAUSE_AUTOMATION_RULE',
  'RECORD_GOAL_CONTRIBUTION',
  'EXTEND_GOAL_TARGET_DATE',
];

function isKnownKind(value: unknown): value is OperationalActionKind {
  return typeof value === 'string' && (KNOWN_KINDS as string[]).includes(value);
}

function readMetaString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : null;
}

function readForecastSummary(metadata: unknown, key: string): ForecastSummaryDto | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>)[key];
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.generatedAt !== 'string') return null;
  const riskCodes = Array.isArray(o.riskCodes) ? (o.riskCodes.filter(x => typeof x === 'string') as string[]) : [];
  const lowest = typeof o.lowestProjectedBalance30d === 'number' ? o.lowestProjectedBalance30d : null;
  const lowestDate = typeof o.lowestProjectedBalanceDate30d === 'string' ? o.lowestProjectedBalanceDate30d : null;
  const ending = typeof o.projectedEndingBalance30d === 'number' ? o.projectedEndingBalance30d : null;
  return {
    generatedAt: o.generatedAt,
    riskCodes,
    lowestProjectedBalance30d: lowest,
    lowestProjectedBalanceDate30d: lowestDate,
    projectedEndingBalance30d: ending,
  };
}

function diff(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Number((a - b).toFixed(2));
}

function buildBalanceDelta(event: FinancialEvent): AppliedActionBalanceDeltaDto | null {
  const before = readForecastSummary(event.metadata, 'forecastSummaryBefore');
  const after = readForecastSummary(event.metadata, 'forecastSummaryAfter');
  if (!before || !after) return null;
  return {
    forecastSummaryBefore: before,
    forecastSummaryAfter: after,
    lowestProjectedBalanceDeltaUsd: diff(after.lowestProjectedBalance30d, before.lowestProjectedBalance30d),
    projectedEndingBalanceDeltaUsd: diff(after.projectedEndingBalance30d, before.projectedEndingBalance30d),
    capturedAtEventId: event.id,
    capturedAt: event.createdAt.toISOString(),
  };
}

export function aggregateAppliedActions(events: FinancialEvent[]): AppliedActionAggregateDto[] {
  const byKind = new Map<OperationalActionKind, AppliedActionAggregateDto>();
  const latestEventByKind = new Map<OperationalActionKind, FinancialEvent>();

  for (const e of events) {
    if (e.type !== FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED) continue;
    const kindRaw = e.metadata && typeof e.metadata === 'object' && !Array.isArray(e.metadata)
      ? (e.metadata as Record<string, unknown>).kind
      : null;
    if (!isKnownKind(kindRaw)) continue;
    const before = readMetaString(e.metadata, 'forecastBeforeAt');
    const after = readMetaString(e.metadata, 'forecastAfterAt');
    const cur = byKind.get(kindRaw) ?? {
      kind: kindRaw,
      count: 0,
      oldestForecastBeforeAt: null,
      newestForecastAfterAt: null,
      latestBalanceDelta: null,
    };
    cur.count += 1;
    if (before && (!cur.oldestForecastBeforeAt || before < cur.oldestForecastBeforeAt)) {
      cur.oldestForecastBeforeAt = before;
    }
    if (after && (!cur.newestForecastAfterAt || after > cur.newestForecastAfterAt)) {
      cur.newestForecastAfterAt = after;
    }
    const latest = latestEventByKind.get(kindRaw);
    if (!latest || e.createdAt > latest.createdAt) {
      latestEventByKind.set(kindRaw, e);
    }
    byKind.set(kindRaw, cur);
  }

  for (const [kind, agg] of byKind) {
    const latest = latestEventByKind.get(kind);
    agg.latestBalanceDelta = latest ? buildBalanceDelta(latest) : null;
  }

  return Array.from(byKind.values()).sort((a, b) => b.count - a.count);
}

export function aggregateGoalContributions(events: FinancialEvent[]): GoalContributionAggregateDto {
  let count = 0;
  let totalUsd = 0;
  const goals = new Set<string>();
  let milestoneCount = 0;
  for (const e of events) {
    if (e.type === FinancialEventType.GOAL_CONTRIBUTION_RECORDED) {
      count += 1;
      if (typeof e.amount === 'number' && Number.isFinite(e.amount)) {
        totalUsd += Math.max(0, e.amount);
      }
      if (e.relatedEntityId) goals.add(e.relatedEntityId);
    } else if (e.type === FinancialEventType.GOAL_MILESTONE_REACHED) {
      milestoneCount += 1;
    }
  }
  return {
    count,
    totalUsd: Number(totalUsd.toFixed(2)),
    goalsTouched: goals.size,
    milestoneCount,
  };
}

export function countAttentionAutoResolved(events: FinancialEvent[]): number {
  let n = 0;
  for (const e of events) {
    if (e.type === FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED) n += 1;
  }
  return n;
}

export function countActivationMilestones(events: FinancialEvent[]): number {
  let n = 0;
  for (const e of events) {
    if (e.type === FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE) n += 1;
  }
  return n;
}

export interface NotificationLikeRow {
  id: string;
  createdAt: Date;
  readAt: Date | null;
  metadata: unknown;
}

export function countRecommendationsIssued(rows: NotificationLikeRow[], sinceMs: number): number {
  let n = 0;
  for (const r of rows) {
    if (r.createdAt.getTime() < sinceMs) continue;
    const ak = readAttentionKind(r.metadata);
    if (ak?.startsWith('operational_action_')) n += 1;
  }
  return n;
}

export function countDismissedActions(rows: NotificationLikeRow[], sinceMs: number): number {
  let n = 0;
  for (const r of rows) {
    const ak = readAttentionKind(r.metadata);
    if (!ak?.startsWith('operational_action_')) continue;
    const dismissedAt = readMetaString(r.metadata, 'dismissedAt');
    if (!dismissedAt) continue;
    const ts = Date.parse(dismissedAt);
    if (Number.isNaN(ts) || ts < sinceMs) continue;
    n += 1;
  }
  return n;
}

export function buildOpenAttentionState(
  rows: NotificationLikeRow[],
  queueSize: number,
  now: Date
): OpenAttentionStateDto {
  let oldestAge: number | null = null;
  let oldestId: string | null = null;
  for (const r of rows) {
    if (r.readAt) continue;
    const proposal = readOperationalProposal(r.metadata);
    if (!proposal || proposal.status !== 'pending') continue;
    const age = differenceInCalendarDays(now, r.createdAt);
    if (oldestAge === null || age > oldestAge) {
      oldestAge = age;
      oldestId = r.id;
    }
  }
  return {
    queueSize,
    oldestPendingProposalAgeDays: oldestAge,
    oldestPendingProposalNotificationId: oldestId,
  };
}

export function buildResolutionMomentumFactors(input: {
  appliedActions: AppliedActionAggregateDto[];
  attentionAutoResolved: number;
  goalContributions: GoalContributionAggregateDto;
  activationMilestonesInWindow: number;
  windowDays: number;
}): WorkflowResolutionMomentumFactorDto[] {
  const factors: WorkflowResolutionMomentumFactorDto[] = [];
  const totalApplied = input.appliedActions.reduce((s, a) => s + a.count, 0);

  if (totalApplied > 0) {
    factors.push({
      code: 'CORRECTIVE_ACTIONS_APPLIED',
      summary: `${totalApplied} corrective operational action(s) applied in the last ${input.windowDays} day(s).`,
      reasoning: [
        'Counts FinancialEvent rows of type OPERATIONAL_FINANCIAL_ACTION_APPLIED in window, grouped by metadata.kind.',
        'Each event is written by the operational action engine after explicit user approval and live forecast match.',
      ],
    });
  }
  if (input.attentionAutoResolved > 0) {
    factors.push({
      code: 'ATTENTION_AUTO_RESOLVED',
      summary: `${input.attentionAutoResolved} attention row(s) auto-resolved by the deterministic engine.`,
      reasoning: [
        'Counts FinancialEvent rows of type OPERATIONAL_ATTENTION_AUTO_RESOLVED in window.',
        'Indicates that the underlying state (forecast, goal analysis, invoice/job) no longer warrants attention.',
      ],
    });
  }
  if (input.goalContributions.count > 0) {
    factors.push({
      code: 'GOAL_CONTRIBUTIONS_LOGGED',
      summary: `${input.goalContributions.count} goal contribution(s) totaling $${input.goalContributions.totalUsd.toFixed(2)} across ${input.goalContributions.goalsTouched} goal(s).`,
      reasoning: [
        'Counts FinancialEvent rows of type GOAL_CONTRIBUTION_RECORDED in window; sums amounts and distinct relatedEntityId.',
      ],
    });
  }
  if (input.goalContributions.milestoneCount > 0) {
    factors.push({
      code: 'GOAL_MILESTONES_REACHED',
      summary: `${input.goalContributions.milestoneCount} goal milestone(s) reached.`,
      reasoning: ['Counts FinancialEvent rows of type GOAL_MILESTONE_REACHED in window.'],
    });
  }
  if (input.activationMilestonesInWindow > 0) {
    factors.push({
      code: 'ACTIVATION_PROGRESS_RECORDED',
      summary: `${input.activationMilestonesInWindow} adaptive activation milestone(s) recorded.`,
      reasoning: [
        'Counts FinancialEvent rows of type OPERATIONAL_ACTIVATION_MILESTONE in window — first-time crossings only (deduped via UserOperationalCheckpoint).',
      ],
    });
  }
  return factors;
}

export function clampWindowDays(raw: unknown, fallback = 14): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : typeof raw === 'number' ? raw : fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(60, Math.trunc(n)));
}
