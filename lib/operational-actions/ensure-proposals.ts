import type { Prisma } from '@prisma/client';
import { AutomationNotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { buildOperationalActionProposalRows } from '@/lib/operational-actions/build-proposals';
import { readAttentionKind, readOperationalProposal } from '@/lib/operational-actions/metadata';
import type { OperationalActionKind, OperationalActionProposalRow } from '@/lib/operational-actions/types';

function isOperationalActionAttentionKind(ak: string | null): boolean {
  return Boolean(ak?.startsWith('operational_action_'));
}

/**
 * Kinds that this engine auto-builds. The sweep is allowed to mark stale rows
 * read for these kinds; everything else (drag-and-drop shift-bill, manual
 * reserve-prep) is user-initiated and must NOT be touched by the sweep.
 */
const AUTO_BUILT_KINDS: ReadonlySet<OperationalActionKind> = new Set([
  'PAUSE_AUTOMATION_RULE',
  'RECORD_GOAL_CONTRIBUTION',
  'EXTEND_GOAL_TARGET_DATE',
]);

async function markRead(userId: string, id: string, reason: string): Promise<void> {
  const row = await prisma.automationNotification.findFirst({
    where: { id, userId },
    select: { metadata: true },
  });
  if (!row) return;
  const md = mergeNotificationMetadata(row.metadata, {
    autoResolvedAt: new Date().toISOString(),
    autoResolvedReason: reason,
  });
  await prisma.automationNotification.update({
    where: { id },
    data: { readAt: new Date(), metadata: md as unknown as Prisma.InputJsonValue },
  });
}

function buildMeta(row: OperationalActionProposalRow): Prisma.InputJsonValue {
  const pack = buildOperationalAttentionMetadata(
    [
      { type: 'OPEN_CASH_FLOW' },
      { type: 'OPEN_MONEY_CONTROL', tab: 'rules' },
      { type: 'OPEN_MONEY_CONTROL', tab: 'buckets' },
    ],
    {
      attentionKind: row.attentionKind,
      trust: {
        why: row.proposal.explain.why,
        whatChanged: row.proposal.explain.dataInfluences.join(' · '),
        recommendedNextStep: row.proposal.explain.expectedImpact,
        sourceEventType: 'OPERATIONAL_ACTION_PROPOSAL',
      },
    }
  ) as Record<string, unknown>;
  pack.operationalActionProposal = row.proposal;
  return pack as unknown as Prisma.InputJsonValue;
}

/**
 * Upserts deterministic operational action proposals and auto-resolves rows that are no longer emitted.
 */
export async function ensureOperationalActionProposals(userId: string): Promise<void> {
  const desired = await buildOperationalActionProposalRows(userId);
  const desiredKinds = new Set(desired.map(d => d.attentionKind));

  const candidates = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 180,
    select: { id: true, metadata: true },
  });

  for (const c of candidates) {
    const ak = readAttentionKind(c.metadata);
    if (!ak || !isOperationalActionAttentionKind(ak)) continue;
    if (desiredKinds.has(ak)) continue;
    const proposal = readOperationalProposal(c.metadata);
    // User-initiated proposals (drag-and-drop shift-bill, manual reserve-prep)
    // are never produced by buildOperationalActionProposalRows. They must not
    // be auto-marked read by this sweep — only the user can dismiss/apply them.
    if (proposal && !AUTO_BUILT_KINDS.has(proposal.kind)) continue;
    await markRead(userId, c.id, 'operational_action_source_no_longer_recommended');
  }

  for (const row of desired) {
    const existing = await prisma.automationNotification.findFirst({
      where: {
        userId,
        metadata: { path: ['attentionKind'], equals: row.attentionKind },
      },
      select: { id: true, metadata: true, readAt: true },
    });

    const prev = existing ? readOperationalProposal(existing.metadata) : null;
    if (prev?.status === 'applied') {
      continue;
    }
    if (prev?.status === 'dismissed' && prev.fingerprint === row.proposal.fingerprint) {
      continue;
    }

    const proposal = { ...row.proposal, status: 'pending' as const };

    const metaFinal = buildMeta({ ...row, proposal });

    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          type: AutomationNotificationType.AUTOMATION_ACTION,
          title: row.title,
          body: row.body,
          severity: row.severity,
          readAt: null,
          metadata: metaFinal,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: row.severity,
        title: row.title,
        body: row.body,
        metadata: metaFinal,
      });
    }
  }
}
