import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';

export async function GET() {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const sessions = await prisma.mentorSession.findMany({
    where: {
      mentorId: ctx.mentor.id,
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
    },
    select: {
      userId: true,
      scheduledAt: true,
      status: true,
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  });

  const byUser = new Map<
    string,
    {
      id: string;
      name: string | null;
      image: string | null;
      totalSessions: number;
      lastSessionAt: string;
      status: string;
    }
  >();

  for (const s of sessions) {
    const existing = byUser.get(s.userId);
    if (existing) {
      existing.totalSessions += 1;
      if (s.scheduledAt > new Date(existing.lastSessionAt)) {
        existing.lastSessionAt = s.scheduledAt.toISOString();
        existing.status = s.status;
      }
    } else {
      byUser.set(s.userId, {
        id: s.user.id,
        name: s.user.name,
        image: s.user.image,
        totalSessions: 1,
        lastSessionAt: s.scheduledAt.toISOString(),
        status: s.status,
      });
    }
  }

  return NextResponse.json({
    clients: Array.from(byUser.values()),
    privacyNotice:
      'Member insights are read-only summaries. Email, exports, and bulk downloads are not available.',
    exportDisabled: true,
  });
}
