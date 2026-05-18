import { NextResponse } from 'next/server';
import { SessionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';

const UPCOMING: SessionStatus[] = [
  SessionStatus.SCHEDULED,
  SessionStatus.CONFIRMED,
  SessionStatus.IN_PROGRESS,
];

/** Member's booked mentor sessions (for video join + messaging context). */
export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const sessions = await prisma.mentorSession.findMany({
    where: {
      userId: session.user.id,
      status: { in: UPCOMING },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 30,
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      sessionType: true,
      duration: true,
      meetingUrl: true,
      mentor: { select: { id: true, name: true, headshotUrl: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map(s => ({
      id: s.id,
      scheduledAt: s.scheduledAt.toISOString(),
      status: s.status,
      sessionType: s.sessionType,
      duration: s.duration,
      meetingUrl: s.meetingUrl,
      mentor: s.mentor,
    })),
  });
}
