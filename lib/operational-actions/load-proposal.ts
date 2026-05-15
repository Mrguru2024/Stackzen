import { prisma } from '@/lib/prisma';
import { readAttentionKind, readOperationalProposal } from '@/lib/operational-actions/metadata';
import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';

export async function loadOperationalProposalForUser(
  userId: string,
  notificationId: string
): Promise<{ notificationId: string; attentionKind: string; proposal: OperationalActionProposalCore } | null> {
  const n = await prisma.automationNotification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, metadata: true },
  });
  if (!n) return null;
  const ak = readAttentionKind(n.metadata);
  if (!ak?.startsWith('operational_action_')) return null;
  const proposal = readOperationalProposal(n.metadata);
  if (!proposal) return null;
  return { notificationId: n.id, attentionKind: ak, proposal };
}
