import { prisma } from '@/lib/prisma';
import { readAttentionKind, readOperationalProposal } from '@/lib/operational-actions/metadata';
import type { OperationalActionKind } from '@/lib/operational-actions/types';

export type OperationalActionListItemDto = {
  notificationId: string;
  attentionKind: string;
  title: string;
  body: string;
  kind: OperationalActionKind;
  createdAt: string;
};

export async function listPendingOperationalProposals(userId: string): Promise<OperationalActionListItemDto[]> {
  const rows = await prisma.automationNotification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: 'desc' },
    take: 120,
    select: { id: true, title: true, body: true, metadata: true, createdAt: true },
  });

  const out: OperationalActionListItemDto[] = [];
  for (const r of rows) {
    const ak = readAttentionKind(r.metadata);
    if (!ak?.startsWith('operational_action_')) continue;
    const p = readOperationalProposal(r.metadata);
    if (!p || p.status !== 'pending') continue;
    out.push({
      notificationId: r.id,
      attentionKind: ak,
      title: r.title,
      body: r.body,
      kind: p.kind,
      createdAt: r.createdAt.toISOString(),
    });
  }
  return out;
}
