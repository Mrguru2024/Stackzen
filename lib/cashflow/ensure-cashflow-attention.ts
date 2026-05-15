import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEventSource,
  FinancialEventType,
  NotificationSeverity,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import type { RiskFindingDto } from '@/lib/cashflow/types';

function mapRiskToAttention(r: RiskFindingDto): {
  kind: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
} {
  const kind = `cashflow_${r.code.toLowerCase()}`;
  const sev =
    r.severity === 'critical'
      ? NotificationSeverity.CRITICAL
      : r.severity === 'warning'
        ? NotificationSeverity.WARNING
        : NotificationSeverity.INFO;
  return {
    kind,
    severity: sev,
    title: `Cash flow · ${r.summary}`,
    body: r.detail,
  };
}

function buildMeta(mapped: ReturnType<typeof mapRiskToAttention>, r: RiskFindingDto): Prisma.InputJsonValue {
  const base = buildOperationalAttentionMetadata(
    [{ type: 'OPEN_CASH_FLOW' }],
    {
      attentionKind: mapped.kind,
      trust: {
        why: r.summary,
        whatChanged: r.detail,
        recommendedNextStep: 'Open Cash Flow for balances, timing, and assumptions.',
        sourceEventType: 'CASHFLOW_RISK_DETECTED',
      },
    }
  ) as Record<string, unknown>;

  return {
    ...base,
    cashflowRisk: {
      code: r.code,
      confidence: r.confidence,
      summary: r.summary,
      detail: r.detail,
    },
  } as Prisma.InputJsonValue;
}

/**
 * Idempotent operational alerts derived from deterministic forecast risks.
 */
export async function ensureCashflowAttentionNotifications(userId: string): Promise<void> {
  const forecast = await buildCashFlowForecast(userId, { includeDetails: false });

  for (const r of forecast.risks) {
    const mapped = mapRiskToAttention(r);
    const metaFinal = buildMeta(mapped, r);

    const existing = await prisma.automationNotification.findFirst({
      where: {
        userId,
        metadata: { path: ['attentionKind'], equals: mapped.kind },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title: mapped.title,
          body: mapped.body,
          severity: mapped.severity,
          metadata: metaFinal,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: mapped.severity,
        title: mapped.title,
        body: mapped.body,
        metadata: metaFinal,
      });

      await createFinancialEventSafe({
        userId,
        type: FinancialEventType.CASHFLOW_RISK_DETECTED,
        source: FinancialEventSource.API_AUTOMATION,
        metadata: {
          attentionKind: mapped.kind,
          riskCode: r.code,
          confidence: r.confidence,
        },
      });
    }
  }
}
