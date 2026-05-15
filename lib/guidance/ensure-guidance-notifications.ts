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
import { buildGuidanceRecommendations } from '@/lib/guidance/engine';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import type { GuidancePriorityLevel, GuidanceRecommendation } from '@/lib/guidance/types';

function priorityToSeverity(p: GuidancePriorityLevel): NotificationSeverity {
  switch (p) {
    case 'critical':
      return NotificationSeverity.CRITICAL;
    case 'high':
      return NotificationSeverity.WARNING;
    case 'medium':
      return NotificationSeverity.WARNING;
    default:
      return NotificationSeverity.INFO;
  }
}

function buildMetadata(rec: GuidanceRecommendation, forecastInputs: Record<string, unknown>): Prisma.InputJsonValue {
  const pack = buildOperationalAttentionMetadata(rec.clientActions, {
    attentionKind: `guidance_${rec.attentionKey}`,
    trust: {
      why: rec.explain.why,
      whatChanged: rec.explain.dataInfluences.join(' · '),
      recommendedNextStep: rec.explain.expectedImpact,
      sourceEventType: 'GUIDANCE_ENGINE_SYNCED',
    },
  }) as Record<string, unknown>;

  return {
    ...pack,
    guidance: {
      kind: rec.logicalKind,
      priority: rec.priority,
      riskCode: rec.sourceRiskCode ?? null,
      inputsUsed: forecastInputs,
      calculations: rec.explain.calculations,
      expectedImpact: rec.explain.expectedImpact,
      confidence: rec.explain.confidence,
    },
    guidanceEngineVersion: 1,
  } as Prisma.InputJsonValue;
}

/**
 * Upserts deterministic guidance rows into the operational attention queue.
 */
export async function ensureGuidanceAttentionNotifications(userId: string): Promise<void> {
  const { recommendations, forecastSnapshot } = await buildGuidanceRecommendations(userId);
  const forecastInputs: Record<string, unknown> = {
    ...forecastSnapshot.inputsUsed,
    riskCodes: forecastSnapshot.riskCodes,
    generatedAt: forecastSnapshot.generatedAt,
  };

  for (const rec of recommendations) {
    const attentionKind = `guidance_${rec.attentionKey}`;
    const metaFinal = buildMetadata(rec, forecastInputs);

    const existing = await prisma.automationNotification.findFirst({
      where: {
        userId,
        metadata: { path: ['attentionKind'], equals: attentionKind },
      },
      select: { id: true },
    });

    const severity = priorityToSeverity(rec.priority);

    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          type: AutomationNotificationType.AUTOMATION_ACTION,
          severity,
          title: rec.title,
          body: rec.body,
          metadata: metaFinal,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity,
        title: rec.title,
        body: rec.body,
        metadata: metaFinal,
      });
    }
  }

  await createFinancialEventSafe({
    userId,
    type: FinancialEventType.GUIDANCE_ENGINE_SYNCED,
    source: FinancialEventSource.API_GUIDANCE,
    metadata: {
      recommendationCount: recommendations.length,
      keys: recommendations.map(r => r.attentionKey),
    },
  });
}
