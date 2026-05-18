import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { mentorHasMenteeRelationship } from '@/lib/mentors/access';

const createSchema = z.object({ mentorId: z.string().cuid() }).strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const conversations = await prisma.mentorConversation.findMany({
    where: { memberUserId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      mentor: { select: { id: true, name: true, headshotUrl: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true, senderUserId: true },
      },
    },
  });

  return NextResponse.json({
    conversations: conversations.map(c => ({
      id: c.id,
      mentor: {
        id: c.mentor.id,
        name: c.mentor.name,
        image: c.mentor.headshotUrl,
      },
      lastMessage: c.messages[0]
        ? {
            body: c.messages[0].body.slice(0, 120),
            createdAt: c.messages[0].createdAt.toISOString(),
            isMine: c.messages[0].senderUserId === session.user.id,
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id: parsed.data.mentorId },
    select: { id: true, isActive: true, isVerified: true, applicationStatus: true },
  });
  if (!mentor) {
    return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
  }

  const linked = await mentorHasMenteeRelationship(mentor.id, session.user.id);
  if (!linked) {
    return NextResponse.json(
      { error: 'Messaging opens after you book a session with this mentor.' },
      { status: 403 }
    );
  }

  const conversation = await prisma.mentorConversation.upsert({
    where: {
      mentorId_memberUserId: {
        mentorId: mentor.id,
        memberUserId: session.user.id,
      },
    },
    create: {
      mentorId: mentor.id,
      memberUserId: session.user.id,
    },
    update: {},
    select: { id: true },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
