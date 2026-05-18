import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { mentorHasMenteeRelationship } from '@/lib/mentors/access';

const createSchema = z.object({ memberUserId: z.string().cuid() }).strict();

export async function GET() {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const conversations = await prisma.mentorConversation.findMany({
    where: { mentorId: ctx.mentor.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      member: { select: { id: true, name: true, image: true } },
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
      member: c.member,
      lastMessage: c.messages[0]
        ? {
            body: c.messages[0].body.slice(0, 120),
            createdAt: c.messages[0].createdAt.toISOString(),
            isMine: c.messages[0].senderUserId === ctx.userId,
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

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

  const linked = await mentorHasMenteeRelationship(ctx.mentor.id, parsed.data.memberUserId);
  if (!linked) {
    return NextResponse.json(
      { error: 'Messaging is only available for members with an active mentoring session.' },
      { status: 403 }
    );
  }

  const conversation = await prisma.mentorConversation.upsert({
    where: {
      mentorId_memberUserId: {
        mentorId: ctx.mentor.id,
        memberUserId: parsed.data.memberUserId,
      },
    },
    create: {
      mentorId: ctx.mentor.id,
      memberUserId: parsed.data.memberUserId,
    },
    update: {},
    select: { id: true },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
