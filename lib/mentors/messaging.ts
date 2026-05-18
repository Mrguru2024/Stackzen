import 'server-only';
import { prisma } from '@/lib/prisma';
import { publishMentorConversation } from '@/lib/mentors/chat-bus';

export type ConversationParticipant =
  | { role: 'mentor'; mentorId: string; userId: string }
  | { role: 'member'; memberUserId: string; userId: string };

export async function loadConversationParticipant(
  conversationId: string,
  userId: string
): Promise<
  | ({
      conversationId: string;
      mentorId: string;
      memberUserId: string;
    } & ConversationParticipant)
  | null
> {
  const conversation = await prisma.mentorConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      mentorId: true,
      memberUserId: true,
      mentor: { select: { userId: true } },
    },
  });
  if (!conversation) return null;

  if (conversation.memberUserId === userId) {
    return {
      conversationId: conversation.id,
      mentorId: conversation.mentorId,
      memberUserId: conversation.memberUserId,
      role: 'member',
      userId,
    };
  }
  if (conversation.mentor.userId === userId) {
    return {
      conversationId: conversation.id,
      mentorId: conversation.mentorId,
      memberUserId: conversation.memberUserId,
      role: 'mentor',
      userId,
    };
  }
  return null;
}

export async function listMessagesForConversation(conversationId: string, viewerUserId: string) {
  const messages = await prisma.mentorMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: {
      id: true,
      body: true,
      senderUserId: true,
      createdAt: true,
    },
  });

  await prisma.mentorMessage.updateMany({
    where: {
      conversationId,
      readAt: null,
      NOT: { senderUserId: viewerUserId },
    },
    data: { readAt: new Date() },
  });

  return messages.map(m => ({
    id: m.id,
    body: m.body,
    isMine: m.senderUserId === viewerUserId,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function createConversationMessage(input: {
  conversationId: string;
  senderUserId: string;
  body: string;
}) {
  const message = await prisma.mentorMessage.create({
    data: {
      conversationId: input.conversationId,
      senderUserId: input.senderUserId,
      body: input.body.trim(),
    },
    select: { id: true, createdAt: true, senderUserId: true, body: true },
  });

  await prisma.mentorConversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  publishMentorConversation(input.conversationId, {
    type: 'message',
    conversationId: input.conversationId,
    messageId: message.id,
  });

  return message;
}
