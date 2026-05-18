import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import {
  createConversationMessage,
  listMessagesForConversation,
  loadConversationParticipant,
} from '@/lib/mentors/messaging';

const postSchema = z.object({ body: z.string().min(1).max(4000) }).strict();

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { conversationId } = await params;
  const participant = await loadConversationParticipant(conversationId, session.user.id);
  if (!participant || participant.role !== 'member') {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await listMessagesForConversation(conversationId, session.user.id);

  return NextResponse.json({
    messages,
    readOnly: false,
    exportDisabled: true,
  });
}

export async function POST(request: Request, { params }: RouteCtx) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { conversationId } = await params;
  const participant = await loadConversationParticipant(conversationId, session.user.id);
  if (!participant || participant.role !== 'member') {
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
    senderUserId: session.user.id,
    body: parsed.data.body,
  });

  return NextResponse.json({
    id: message.id,
    createdAt: message.createdAt.toISOString(),
  });
}
