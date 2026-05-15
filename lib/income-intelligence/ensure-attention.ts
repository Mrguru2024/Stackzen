import type { Prisma } from '@prisma/client';
import { AutomationNotificationType, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { buildIncomeIntelligenceSnapshot } from '@/lib/income-intelligence/snapshot';
import type { IncomeIntelligenceSnapshotDto } from '@/lib/income-intelligence/types';

const KIND_DELAYED = 'income_intel_delayed';
const KIND_CONCENTRATION = 'income_intel_concentration';
const KIND_IRREGULAR = 'income_intel_irregular';
const KIND_DECLINING = 'income_intel_declining';

function findExisting(userId: string, attentionKind: string) {
  return prisma.automationNotification.findFirst({
    where: {
      userId,
      metadata: { path: ['attentionKind'], equals: attentionKind },
    },
    select: { id: true, readAt: true, metadata: true },
  });
}

async function markReadIfExists(
  userId: string,
  attentionKind: string,
  reason: string
): Promise<void> {
  const existing = await findExisting(userId, attentionKind);
  if (existing && !existing.readAt) {
    const md = mergeNotificationMetadata(existing.metadata, {
      autoResolvedAt: new Date().toISOString(),
      autoResolvedReason: reason,
    });
    await prisma.automationNotification.update({
      where: { id: existing.id },
      data: { readAt: new Date(), metadata: md as unknown as Prisma.InputJsonValue },
    });
  }
}

/**
 * Idempotent operational attention for income timing, concentration, and payout irregularity.
 * Deterministic thresholds only — no synthetic income scores.
 */
export async function ensureIncomeIntelligenceAttentionNotifications(
  userId: string,
  cachedSnapshot?: IncomeIntelligenceSnapshotDto
): Promise<void> {
  const snap = cachedSnapshot ?? (await buildIncomeIntelligenceSnapshot(userId));

  const hasDelayed = snap.delayedIncome.length > 0;
  const hhi = snap.concentration.herfindahlIndex;
  const topShare = snap.concentration.topSources[0]?.shareOfTotal ?? 0;
  const hasConcentration = hhi >= 0.48 || topShare >= 0.58;
  const hasIrregular = snap.irregularPayouts.length > 0;
  const hasDeclining = snap.decliningPayouts.length > 0;

  if (!hasDelayed) {
    await markReadIfExists(userId, KIND_DELAYED, 'income_intel_no_delayed_expected_deposits');
  } else {
    const worst = snap.delayedIncome.slice(0, 4);
    const title = 'Income intelligence · expected deposit(s) overdue';
    const body =
      worst
        .map(
          w =>
            `${w.label}: ${w.daysPastExpected}d past expected (${w.cadence}, median ~$${w.medianAmountUsd.toFixed(0)})`
        )
        .join(' · ') + ' — confirm recent inflows in Money Control and Cash Flow.';

    const meta = buildOperationalAttentionMetadata(
      [
        { type: 'OPEN_MONEY_CONTROL', tab: 'review' },
        { type: 'OPEN_CASH_FLOW' },
      ],
      {
        attentionKind: KIND_DELAYED,
        trust: {
          why: 'Derived from recurring income series on FinancialTransaction using the same cadence model as Cash Flow.',
          whatChanged: `Series keys: ${worst.map(w => w.seriesKey).join(', ')}`,
          recommendedNextStep: 'Review ledger inflows for those payers and refresh bank sync if deposits are missing.',
          sourceEventType: 'INCOME_INTEL_DELAYED',
        },
      }
    ) as Record<string, unknown>;

    meta.incomeIntelligence = {
      delayed: worst,
      sampleTransactionIds: worst.flatMap(w => w.sampleTransactionIds).slice(0, 12),
    };

    const existing = await findExisting(userId, KIND_DELAYED);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.WARNING,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.WARNING,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }

  if (!hasConcentration) {
    await markReadIfExists(userId, KIND_CONCENTRATION, 'income_intel_concentration_below_threshold');
  } else {
    const title = 'Income intelligence · concentration risk on ledger inflows';
    const body = `Largest-source share ≈ ${(topShare * 100).toFixed(1)}%; Herfindahl-style index ≈ ${hhi.toFixed(
      3
    )}. Diversify payers or increase reserves when one label dominates cash-in.`;

    const meta = buildOperationalAttentionMetadata(
      [{ type: 'OPEN_CASH_FLOW' }, { type: 'OPEN_MONEY_CONTROL', tab: 'review' }],
      {
        attentionKind: KIND_CONCENTRATION,
        trust: {
          why: 'Computed from squared shares of non-transfer INFLOW totals over 90 days, grouped by normalized merchant/description keys.',
          whatChanged: snap.concentration.topSources[0]
            ? `Top label: ${snap.concentration.topSources[0].label}`
            : undefined,
          recommendedNextStep: 'Map payers to invoices/jobs where applicable and stress-test Cash Flow with slower inflows.',
          sourceEventType: 'INCOME_INTEL_CONCENTRATION',
        },
      }
    ) as Record<string, unknown>;

    meta.incomeIntelligence = {
      concentration: snap.concentration,
    };

    const existing = await findExisting(userId, KIND_CONCENTRATION);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.WARNING,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.WARNING,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }

  if (!hasIrregular) {
    await markReadIfExists(userId, KIND_IRREGULAR, 'income_intel_no_irregular_series');
  } else {
    const series = snap.irregularPayouts.slice(0, 4);
    const title = 'Income intelligence · irregular payout intervals';
    const body =
      series
        .map(
          i =>
            `${i.series.label} (${i.series.cadence}, confidence ${i.series.confidence.toFixed(2)}, n=${i.series.occurrences})`
        )
        .join(' · ') + ' — payout timing is unstable vs historical median interval.';

    const meta = buildOperationalAttentionMetadata([{ type: 'OPEN_CASH_FLOW' }], {
      attentionKind: KIND_IRREGULAR,
      trust: {
        why: 'Uses recurrence confidence from lib/cashflow/recurrence (interval MAD vs median interval, scaled by sample depth).',
        whatChanged: series.map(s => s.series.key).join(', '),
        recommendedNextStep: 'Open Cash Flow to see modeled income events and align bill timing with wider buffers.',
        sourceEventType: 'INCOME_INTEL_IRREGULAR',
      },
    }) as Record<string, unknown>;

    meta.incomeIntelligence = {
      irregular: series,
    };

    const existing = await findExisting(userId, KIND_IRREGULAR);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.INFO,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.INFO,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }

  if (!hasDeclining) {
    await markReadIfExists(userId, KIND_DECLINING, 'income_intel_no_declining_payout_pattern');
  } else {
    const items = snap.decliningPayouts.slice(0, 3);
    const title = 'Income intelligence · declining recent payouts';
    const body =
      items
        .map(
          d =>
            `${d.label}: recent median $${d.recentMedianUsd.toFixed(0)} vs prior $${d.priorMedianUsd.toFixed(0)}`
        )
        .join(' · ') + ' — compare against contracts/invoices; verify categorization.';

    const meta = buildOperationalAttentionMetadata([{ type: 'OPEN_MONEY_CONTROL', tab: 'review' }], {
      attentionKind: KIND_DECLINING,
      trust: {
        why: 'Deterministic comparison of median amounts in the last three vs prior three inflows for the same recurring label bucket.',
        whatChanged: items.map(i => i.seriesKey).join(', '),
        recommendedNextStep: 'Open Money Control to confirm amounts are comparable (fees, partial payments, splits).',
        sourceEventType: 'INCOME_INTEL_DECLINING',
      },
    }) as Record<string, unknown>;

    meta.incomeIntelligence = { declining: items };

    const existing = await findExisting(userId, KIND_DECLINING);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.WARNING,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.WARNING,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }
}
