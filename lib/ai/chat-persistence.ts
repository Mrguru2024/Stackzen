import { prisma } from '@/lib/prisma';
import { decryptChatContent, encryptChatContent } from '@/lib/security/chat-content';
import type { AIProviderId } from '@/lib/ai/types';

export type SaveChatMessageOptions = {
  role?: 'user' | 'assistant';
  conversationId?: string;
  provider?: AIProviderId | string;
  model?: string;
};

export async function saveChatMessage(
  userId: string,
  plainContent: string,
  options?: SaveChatMessageOptions
) {
  const { content, isContentEncrypted } = encryptChatContent(plainContent);
  return prisma.chatMessage.create({
    data: {
      userId,
      content,
      isContentEncrypted,
      role: options?.role ?? null,
      conversationId: options?.conversationId ?? null,
      provider: options?.provider ?? null,
      model: options?.model ?? null,
    },
  });
}

export async function listChatMessagesForUser(userId: string, take = 25) {
  const rows = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      content: true,
      isContentEncrypted: true,
      createdAt: true,
      role: true,
      provider: true,
      model: true,
      conversationId: true,
    },
  });

  return rows.map(row => ({
    id: row.id,
    createdAt: row.createdAt,
    content: decryptChatContent(row.content, row.isContentEncrypted),
    role: row.role as 'user' | 'assistant' | null,
    provider: row.provider,
    model: row.model,
    conversationId: row.conversationId,
  }));
}
