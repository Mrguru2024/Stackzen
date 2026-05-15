import type { AutomationNotification, FinancialEvent } from '@prisma/client';
import { isSnoozedActive } from '@/lib/operational-notifications/helpers';
import type { OperationalTrustDto } from '@/lib/operational-notifications/types';
import type {
  OperationalExplainabilityAuditEventDto,
  OperationalExplainabilityBlockDto,
  OperationalExplainabilityDto,
  OperationalExplainabilityLifecycleDto,
} from '@/lib/explainability/types';

function readString(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === 'string' ? v : undefined;
}

export function deriveExplainabilityLifecycle(
  n: AutomationNotification,
  meta: Record<string, unknown>,
  nowMs: number
): OperationalExplainabilityLifecycleDto {
  const dismissedAt = readString(meta, 'dismissedAt');
  const snoozedUntil = readString(meta, 'snoozedUntil');
  const guidanceAppliedAt = readString(meta, 'guidanceAppliedAt');
  const autoResolvedAt = readString(meta, 'autoResolvedAt');
  const autoResolvedReason = readString(meta, 'autoResolvedReason');

  let primary: OperationalExplainabilityLifecycleDto['primary'] = 'active';
  if (autoResolvedAt || dismissedAt || guidanceAppliedAt) {
    primary = 'resolved';
  } else if (isSnoozedActive(meta, nowMs)) {
    primary = 'suppressed';
  } else if (n.readAt) {
    primary = 'acknowledged';
  }

  return {
    primary,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    dismissedAt,
    snoozedUntil,
    guidanceAppliedAt,
    autoResolvedAt,
    autoResolvedReason,
  };
}

function parseGuidanceBlock(meta: Record<string, unknown>): OperationalExplainabilityBlockDto | null {
  const g = meta.guidance;
  if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
  const o = g as Record<string, unknown>;
  const calculations = Array.isArray(o.calculations)
    ? o.calculations.filter((x): x is string => typeof x === 'string')
    : [];
  const inputsUsed =
    o.inputsUsed && typeof o.inputsUsed === 'object' && !Array.isArray(o.inputsUsed)
      ? (o.inputsUsed as Record<string, unknown>)
      : {};
  const logicalKind = typeof o.kind === 'string' ? o.kind : 'UNKNOWN';
  const priority = typeof o.priority === 'string' ? o.priority : 'medium';
  const riskCode = typeof o.riskCode === 'string' ? o.riskCode : null;
  const expectedImpact = typeof o.expectedImpact === 'string' ? o.expectedImpact : '';
  const confidence = typeof o.confidence === 'number' && Number.isFinite(o.confidence) ? o.confidence : 0;
  const engineVersion =
    typeof meta.guidanceEngineVersion === 'number' && Number.isFinite(meta.guidanceEngineVersion)
      ? meta.guidanceEngineVersion
      : null;

  return {
    kind: 'guidance_engine',
    logicalKind,
    priority,
    riskCode,
    calculations,
    inputsUsed,
    confidence,
    expectedImpact,
    engineVersion,
  };
}

function parseCashflowBlock(meta: Record<string, unknown>): OperationalExplainabilityBlockDto | null {
  const c = meta.cashflowRisk;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const o = c as Record<string, unknown>;
  const riskCode = typeof o.code === 'string' ? o.code : '';
  if (!riskCode) return null;
  const confidence = typeof o.confidence === 'number' && Number.isFinite(o.confidence) ? o.confidence : 0;
  const summary = typeof o.summary === 'string' ? o.summary : '';
  const detail = typeof o.detail === 'string' ? o.detail : '';
  return { kind: 'cashflow_risk', riskCode, confidence, summary, detail };
}

function parseGoalBlock(meta: Record<string, unknown>): OperationalExplainabilityBlockDto | null {
  const g = meta.goalPlanning;
  if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
  const o = g as Record<string, unknown>;
  const findingCode = typeof o.findingCode === 'string' ? o.findingCode : '';
  if (!findingCode) return null;
  const reasoningLines = Array.isArray(o.reasoningLines)
    ? o.reasoningLines.filter((x): x is string => typeof x === 'string')
    : [];
  return { kind: 'goal_planning', findingCode, reasoningLines };
}

function toAuditTrail(events: FinancialEvent[]): OperationalExplainabilityAuditEventDto[] {
  return events.map(e => ({
      id: e.id,
      type: e.type,
      source: e.source,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadata ?? null,
    }));
}

/**
 * Build deterministic explainability for one operational notification.
 */
export function buildOperationalExplainability(
  n: AutomationNotification,
  meta: Record<string, unknown>,
  trust: OperationalTrustDto,
  notificationAuditEvents: FinancialEvent[],
  nowMs: number
): OperationalExplainabilityDto {
  const attentionKind = typeof meta.attentionKind === 'string' ? meta.attentionKind : undefined;
  const lifecycle = deriveExplainabilityLifecycle(n, meta, nowMs);

  const blocks: OperationalExplainabilityBlockDto[] = [];

  const g = parseGuidanceBlock(meta);
  if (g) blocks.push(g);

  const cf = parseCashflowBlock(meta);
  if (cf) blocks.push(cf);

  const gp = parseGoalBlock(meta);
  if (gp) blocks.push(gp);

  blocks.push({
    kind: 'trust_reference',
    why: trust.why,
    whatChanged: trust.whatChanged,
    recommendedNextStep: trust.recommendedNextStep,
    sourceEventType: trust.sourceEventType,
  });

  return {
    version: 1,
    notificationId: n.id,
    attentionKind,
    lifecycle,
    blocks,
    auditTrail: toAuditTrail(notificationAuditEvents),
  };
}
