import type { Prisma } from '@prisma/client';
import { AutomationNotificationType, FinancialEntityType, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildConnectivitySnapshot, type ConnectivityStalenessLabel } from '@/lib/bank/connectivity-snapshot';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';

function attentionKindFor(connectionId: string): string {
  return `bank_operational_health_${connectionId}`;
}

function severityFor(staleness: ConnectivityStalenessLabel): NotificationSeverity {
  if (staleness === 'reconnect_required' || staleness === 'post_error') return NotificationSeverity.CRITICAL;
  if (staleness === 'never_synced' || staleness === 'sync_stale') return NotificationSeverity.WARNING;
  return NotificationSeverity.INFO;
}

function titleBody(institutionName: string | null, staleness: ConnectivityStalenessLabel): { title: string; body: string } {
  const inst = institutionName?.trim() || 'Linked bank';
  switch (staleness) {
    case 'reconnect_required':
      return {
        title: `${inst} · connection needs attention`,
        body: 'This bank link is not ACTIVE. Cash flow and Money Control may be using stale balances until you reconnect.',
      };
    case 'post_error':
      return {
        title: `${inst} · last sync reported an error`,
        body: 'The most recent sync error is newer than the last successful sync. Open Money Control to retry sync and review the ledger.',
      };
    case 'never_synced':
      return {
        title: `${inst} · no successful sync yet`,
        body: 'The connection is active but no successful sync timestamp is recorded. Run a sync so your ledger and forecasts use current Plaid data.',
      };
    case 'sync_stale':
      return {
        title: `${inst} · sync is stale`,
        body: 'It has been a while since the last successful bank sync. Forecast confidence and balances may drift from your bank until you sync again.',
      };
    default:
      return { title: `${inst}`, body: '' };
  }
}

function trustFor(staleness: ConnectivityStalenessLabel, row: { syncErrorCode: string | null }) {
  const why =
    staleness === 'healthy'
      ? 'All monitored connectivity signals are within normal thresholds for this connection.'
      : `Deterministic classification: ${staleness} (from BankConnection.status, lastSuccessfulSyncAt, lastSyncErrorAt, and connection age).`;
  return {
    why,
    whatChanged:
      staleness === 'post_error' && row.syncErrorCode
        ? `Last error code recorded on connection: ${row.syncErrorCode}.`
        : undefined,
    recommendedNextStep: 'Open Money Control to run a bank sync or review linked accounts, then confirm timing in Cash Flow.',
    sourceEventType: 'BANK_CONNECTIVITY_CLASSIFIED',
  };
}

/**
 * Upserts per-connection operational attention for bank health; marks read when healthy.
 * Idempotent via metadata.attentionKind + relatedEntity BANK_CONNECTION.
 */
export async function ensureBankConnectivityAttentionNotifications(userId: string): Promise<void> {
  const snapshot = await buildConnectivitySnapshot(userId);

  for (const row of snapshot.connections) {
    const attentionKind = attentionKindFor(row.connectionId);
    const staleness = row.staleness;

    const existing = await prisma.automationNotification.findFirst({
      where: {
        userId,
        relatedEntityType: FinancialEntityType.BANK_CONNECTION,
        relatedEntityId: row.connectionId,
        metadata: { path: ['attentionKind'], equals: attentionKind },
      },
      select: { id: true, readAt: true, metadata: true },
    });

    if (staleness === 'healthy') {
      if (existing && !existing.readAt) {
        const md = mergeNotificationMetadata(existing.metadata, {
          autoResolvedAt: new Date().toISOString(),
          autoResolvedReason: 'bank_connectivity_recovered',
        });
        await prisma.automationNotification.update({
          where: { id: existing.id },
          data: { readAt: new Date(), metadata: md as unknown as Prisma.InputJsonValue },
        });
      }
      continue;
    }

    const { title, body } = titleBody(row.institutionName, staleness);
    const sev = severityFor(staleness);
    const meta = buildOperationalAttentionMetadata(
      [{ type: 'OPEN_MONEY_CONTROL', tab: 'review' }, { type: 'OPEN_CASH_FLOW' }],
      {
        attentionKind,
        trust: trustFor(staleness, row),
      }
    ) as Record<string, unknown>;

    meta.connectivity = {
      staleness,
      connectionId: row.connectionId,
      lastSuccessfulSyncAt: row.lastSuccessfulSyncAt,
      lastSyncErrorAt: row.lastSyncErrorAt,
      hoursSinceLastSuccess: row.hoursSinceLastSuccess,
      recentPlaidInflowCount14d: row.recentPlaidInflowCount14d,
      recentPlaidInflowSum14d: row.recentPlaidInflowSum14d,
    };

    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: sev,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: sev,
        title,
        body,
        relatedEntityType: FinancialEntityType.BANK_CONNECTION,
        relatedEntityId: row.connectionId,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }
}
