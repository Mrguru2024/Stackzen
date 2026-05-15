import type { AutomationNotification, FinancialEvent } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  NotificationSeverity,
} from '@prisma/client';
import type { AutomationClientAction } from '@/lib/financial-automation/actionable-metadata';
import {
  isDismissed,
  isInAttentionQueue,
  isSnoozedActive,
} from '@/lib/operational-notifications/helpers';
import type {
  OperationalAlertDto,
  OperationalUiDomain,
  OperationalUiPriority,
  OperationalTrustDto,
} from '@/lib/operational-notifications/types';
import { buildOperationalDedupeKey } from '@/lib/operational-notifications/dedupe-key';
import { buildOperationalExplainability } from '@/lib/explainability/build-operational-explainability';

function coerceActions(metadata: Record<string, unknown>): AutomationClientAction[] {
  const raw = metadata.actions;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is AutomationClientAction => Boolean(a && typeof (a as { type?: string }).type === 'string')
  ) as AutomationClientAction[];
}

function coerceTrust(
  notification: AutomationNotification,
  meta: Record<string, unknown>,
  event?: FinancialEvent | null
): OperationalTrustDto {
  const packed = meta.trust;
  if (
    packed &&
    typeof packed === 'object' &&
    !Array.isArray(packed) &&
    typeof (packed as OperationalTrustDto).why === 'string' &&
    typeof (packed as OperationalTrustDto).recommendedNextStep === 'string'
  ) {
    const t = packed as OperationalTrustDto;
    return {
      why: t.why,
      whatChanged: t.whatChanged,
      recommendedNextStep: t.recommendedNextStep,
      sourceEventType: t.sourceEventType,
    };
  }

  let why =
    notification.relatedEntityType && notification.relatedEntityId
      ? `Linked to ${notification.relatedEntityType} ${notification.relatedEntityId.slice(0, 8)}…`
      : 'Automation surfaced this alert from your ledger, jobs, invoices, or rules.';

  if (event?.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)) {
    const m = event.metadata as Record<string, unknown>;
    if (typeof m.category === 'string') {
      why = `Category "${m.category}" triggered this based on ledger activity this period.`;
    }
    if (typeof m.percent === 'number') {
      why = `Spend reached ${m.percent.toFixed(0)}% of the configured limit.`;
    }
  }

  return {
    why,
    whatChanged: event?.metadata ? undefined : notification.body.slice(0, 160),
    recommendedNextStep: notification.body.includes('Review')
      ? notification.body
      : `Review the linked record or open Money Control for corrections.`,
    sourceEventType: event?.type,
  };
}

function inferDomain(
  type: AutomationNotificationType,
  related: FinancialEntityType | null,
  attentionKind?: string | undefined
): OperationalUiDomain {
  const k = attentionKind ?? '';
  if (k.startsWith('guidance_')) return 'guidance';
  if (k.startsWith('goal_') || related === FinancialEntityType.OPERATIONAL_GOAL) return 'goals';
  if (k.startsWith('cashflow_')) return 'financial';
  if (k.startsWith('bank_operational_health')) return 'financial';
  if (k.startsWith('income_intel_')) return 'financial';
  if (k.startsWith('operational_action_')) return 'financial';
  if (k.startsWith('contractor_ops_')) return 'work';
  if (k.startsWith('reserve_alloc_ops_')) return 'financial';
  if (k.startsWith('timing_')) return 'financial';
  if (
    related === FinancialEntityType.INVOICE ||
    type === AutomationNotificationType.BILL_DUE_REMINDER ||
    k.includes('invoice')
  ) {
    return 'invoice';
  }
  if (related === FinancialEntityType.JOB || k.includes('job')) return 'work';
  if (
    related === FinancialEntityType.AUTOMATION_RULE ||
    related === FinancialEntityType.AUTOMATION_EXECUTION ||
    type === AutomationNotificationType.SUBSCRIPTION_INCREASE
  ) {
    return 'automation';
  }
  /** Cash collection / payouts that are not modeled as Invoice rows */
  if (related === FinancialEntityType.QUOTE || k.includes('deposit')) return 'billing';
  return 'financial';
}

function deriveUiPriority(
  severity: NotificationSeverity,
  readAt: Date | null,
  meta: Record<string, unknown>
): OperationalUiPriority {
  if (readAt || isDismissed(meta)) return 'resolved';
  if (severity === NotificationSeverity.CRITICAL) return 'critical';
  if (severity === NotificationSeverity.WARNING) return 'warning';
  return 'informational';
}

function deriveSuppressed(meta: Record<string, unknown>, now: number): boolean {
  return isSnoozedActive(meta, now) || isDismissed(meta);
}

export function buildOperationalAlertDto(
  n: AutomationNotification,
  correlation: Map<string, FinancialEvent>,
  now: number,
  notificationAuditEvents: FinancialEvent[] = []
): OperationalAlertDto {
  const meta =
    n.metadata && typeof n.metadata === 'object' && !Array.isArray(n.metadata)
      ? (n.metadata as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const attentionKind =
    typeof meta.attentionKind === 'string' ? meta.attentionKind : undefined;

  const key =
    n.relatedEntityType && n.relatedEntityId
      ? `${n.relatedEntityType}:${n.relatedEntityId}`
      : '';
  const lastEvent = key ? correlation.get(key) ?? null : null;

  const actions = coerceActions(meta);
  const trust = coerceTrust(n, meta, lastEvent ?? undefined);
  const domain = inferDomain(n.type, n.relatedEntityType, attentionKind);
  const dedupeKey = buildOperationalDedupeKey(meta, n.relatedEntityType, n.relatedEntityId);
  const explainability = buildOperationalExplainability(n, meta, trust, notificationAuditEvents, now);

  return {
    id: n.id,
    automationType: n.type,
    domain,
    uiPriority: deriveUiPriority(n.severity, n.readAt, meta),
    severity: n.severity,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
    inAttentionQueue: isInAttentionQueue({ readAt: n.readAt, metadata: n.metadata }, now),
    suppressed: deriveSuppressed(meta, now),
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    actions,
    trust,
    lastFinancialEvent:
      lastEvent && lastEvent.relatedEntityType && lastEvent.relatedEntityId
        ? {
            type: lastEvent.type,
            createdAt: lastEvent.createdAt.toISOString(),
            metadata: lastEvent.metadata ?? null,
          }
        : undefined,
    dedupeKey,
    explainability,
  };
}

export function correlateLatestFinancialEvents(hints: FinancialEvent[]): Map<string, FinancialEvent> {
  const correlation = new Map<string, FinancialEvent>();
  const ordered = [...hints].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id > b.id ? -1 : 1)
  );
  for (const e of ordered) {
    const relId = e.relatedEntityId ?? undefined;
    const relType = e.relatedEntityType ?? undefined;
    if (!relType || !relId) continue;
    const key = `${relType}:${relId}`;
    if (!correlation.has(key)) correlation.set(key, e);
  }
  return correlation;
}
