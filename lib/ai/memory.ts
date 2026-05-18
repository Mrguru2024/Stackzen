import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAiPrivacySettings } from '@/lib/ai/consent';
import { listChatMessagesForUser } from '@/lib/ai/chat-persistence';
import { writeAuditLog } from '@/lib/security/audit-log';

export async function canPersistAiMemory(userId: string): Promise<boolean> {
  const privacy = await getAiPrivacySettings(userId);
  return Boolean(privacy.aiConsentAt && privacy.aiMemoryEnabled && !privacy.aiOptOut);
}

export async function listAiMemory(userId: string, take = 25) {
  const allowed = await canPersistAiMemory(userId);
  if (!allowed) {
    return [];
  }
  return listChatMessagesForUser(userId, take);
}

export async function clearAiMemory(userId: string): Promise<{ deletedMessages: number }> {
  const result = await prisma.chatMessage.deleteMany({ where: { userId } });

  await writeAuditLog({
    userId,
    action: 'ai.memory_cleared',
    resource: userId,
    severity: 'info',
    details: { deletedCount: result.count },
  });

  await prisma.aiInteractionLog.create({
    data: {
      userId,
      action: 'ai.memory_cleared',
      severity: 'info',
      details: { deletedMessages: result.count },
    },
  });

  return { deletedMessages: result.count };
}

export async function logAiInteraction(params: {
  userId: string;
  action: string;
  severity?: 'info' | 'warning' | 'error';
  details?: Record<string, unknown>;
}): Promise<void> {
  await prisma.aiInteractionLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      severity: params.severity ?? 'info',
      details:
        params.details === undefined
          ? undefined
          : (params.details as Prisma.InputJsonValue),
    },
  });
}
