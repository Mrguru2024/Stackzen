import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { loadOperationalProposalForUser } from '@/lib/operational-actions/load-proposal';
import { readOperationalProposal } from '@/lib/operational-actions/metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { OperationalActionApplicationError } from '@/lib/operational-actions/errors';

export async function dismissOperationalProposal(userId: string, notificationId: string): Promise<void> {
  const loaded = await loadOperationalProposalForUser(userId, notificationId);
  if (!loaded) {
    throw new OperationalActionApplicationError('Proposal not found', 404);
  }
  if (loaded.proposal.status !== 'pending') {
    throw new OperationalActionApplicationError('Proposal is not pending', 409);
  }

  const notif = await prisma.automationNotification.findFirst({
    where: { id: notificationId, userId },
    select: { metadata: true },
  });
  const prev = notif ? readOperationalProposal(notif.metadata) : null;
  if (!prev) {
    throw new OperationalActionApplicationError('Invalid metadata', 400);
  }

  const next = { ...prev, status: 'dismissed' as const };
  const md = mergeNotificationMetadata(notif!.metadata, {
    operationalActionProposal: next,
    dismissedAt: new Date().toISOString(),
  });

  await prisma.automationNotification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
      metadata: md as unknown as Prisma.InputJsonValue,
    },
  });
}
