import { NextResponse } from 'next/server';
import { SessionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { applicationStatusLabel } from '@/lib/mentors/access';

export async function GET() {
  const { ctx, response } = await requireMentorPortal();
  if (response || !ctx) return response;

  const now = new Date();
  const [upcoming, unreadMessages, revenueAgg, recentReviews] = await Promise.all([
    prisma.mentorSession.count({
      where: {
        mentorId: ctx.mentor.id,
        status: { in: [SessionStatus.SCHEDULED, SessionStatus.CONFIRMED, SessionStatus.IN_PROGRESS] },
        scheduledAt: { gte: now },
      },
    }),
    prisma.mentorMessage.count({
      where: {
        conversation: { mentorId: ctx.mentor.id },
        readAt: null,
        senderUserId: { not: ctx.userId },
      },
    }),
    prisma.mentorSession.aggregate({
      where: {
        mentorId: ctx.mentor.id,
        status: { in: [SessionStatus.COMPLETED, SessionStatus.CONFIRMED] },
      },
      _sum: { mentorPayout: true },
    }),
    prisma.mentorReview.findMany({
      where: { mentorId: ctx.mentor.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { rating: true, comment: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    mentor: {
      id: ctx.mentor.id,
      name: ctx.mentor.name,
      applicationStatus: ctx.mentor.applicationStatus,
      applicationStatusLabel: applicationStatusLabel(ctx.mentor.applicationStatus),
      canViewClientData: ctx.canViewClientData,
      listedForBooking: ctx.listedForBooking,
      isCertified: ctx.mentor.isCertified,
    },
    stats: {
      upcomingSessions: upcoming,
      unreadMessages,
      totalEarnings: Math.round((revenueAgg._sum.mentorPayout ?? 0) * 100) / 100,
    },
    recentReviews,
  });
}
