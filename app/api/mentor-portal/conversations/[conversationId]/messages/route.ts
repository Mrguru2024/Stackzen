import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';
import {
  createConversationMessage,
  listMessagesForConversation,
} from '@/lib/mentors/messaging';
import { prisma } from '@/lib/prisma';

const postSchema = z.object({ body: z.string().min(1).max(4000) }).strict();

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const { conversationId } = await params;
  const conversation = await prisma.mentorConversation.findFirst({
    where: { id: conversationId, mentorId: ctx.mentor.id },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await listMessagesForConversation(conversationId, ctx.userId);

  return NextResponse.json({
    messages,
    readOnly: false,
    exportDisabled: true,
  });
}

export async function POST(request: Request, { params }: RouteCtx) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const { conversationId } = await params;
  const conversation = await prisma.mentorConversation.findFirst({
    where: { id: conversationId, mentorId: ctx.mentor.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const message = await createConversationMessage({
    conversationId,
    senderUserId: ctx.userId,
    body: parsed.data.body,
  });

  return NextResponse.json({
    id: message.id,
    createdAt: message.createdAt.toISOString(),
  });
}
