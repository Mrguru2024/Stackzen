import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';

export async function GET() {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const sessions = await prisma.mentorSession.findMany({
    where: { mentorId: ctx.mentor.id },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
    select: {
      id: true,
      sessionType: true,
      status: true,
      scheduledAt: true,
      duration: true,
      price: true,
      meetingUrl: true,
      meetingId: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map(s => ({
      id: s.id,
      sessionType: s.sessionType,
      status: s.status,
      scheduledAt: s.scheduledAt.toISOString(),
      duration: s.duration,
      price: s.price,
      meetingUrl: s.meetingUrl,
      hasRoom: Boolean(s.meetingUrl),
      member: {
        id: s.user.id,
        name: s.user.name,
        image: s.user.image,
      },
    })),
  });
}
