import { NextResponse } from 'next/server';
import { SessionStatus } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { canViewMenteeClientData } from '@/lib/mentors/access';

export interface MenteeSessionDto {
  lastSessionAt: string | null;
  nextSessionAt: string | null;
  totalSessions: number;
  status: 'active' | 'inactive';
}

export interface MenteeDto {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  sessions: MenteeSessionDto;
}

export interface MentorResourceDto {
  id: string;
  title: string;
  type: string;
  url: string | null;
  fileUrl: string | null;
  isPublic: boolean;
  downloads: number;
  sharedAt: string;
}

export interface MentorReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: string | null;
  createdAt: string;
}

export interface MentorDashboardDto {
  mentor: { id: string; name: string; isCertified: boolean; isActive: boolean } | null;
  mentees: MenteeDto[];
  resources: MentorResourceDto[];
  recentReviews: MentorReviewDto[];
  totals: {
    activeMentees: number;
    totalSessions: number;
    upcomingSessions: number;
    averageRating: number;
  };
  generatedAt: string;
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const mentor = await prisma.mentor.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        isCertified: true,
        isActive: true,
        rating: true,
        isVerified: true,
        applicationStatus: true,
      },
    });

    if (!mentor) {
      return NextResponse.json<MentorDashboardDto>({
        mentor: null,
        mentees: [],
        resources: [],
        recentReviews: [],
        totals: {
          activeMentees: 0,
          totalSessions: 0,
          upcomingSessions: 0,
          averageRating: 0,
        },
        generatedAt: new Date().toISOString(),
      });
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const showMenteeEmail = canViewMenteeClientData(mentor);

    const [sessionsAll, resources, reviews, upcomingCount] = await Promise.all([
      prisma.mentorSession.findMany({
        where: { mentorId: mentor.id },
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.mentorResource.findMany({
        where: { mentorId: mentor.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
          fileUrl: true,
          isPublic: true,
          downloads: true,
          createdAt: true,
        },
      }),
      prisma.mentorReview.findMany({
        where: { mentorId: mentor.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          comment: true,
          isAnonymous: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.mentorSession.count({
        where: {
          mentorId: mentor.id,
          status: SessionStatus.SCHEDULED,
          scheduledAt: { gte: now },
        },
      }),
    ]);

    const menteeMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        sessions: { lastSessionAt: Date | null; nextSessionAt: Date | null; totalSessions: number; lastActivity: Date };
      }
    >();

    for (const ms of sessionsAll) {
      if (!ms.user) continue;
      const existing = menteeMap.get(ms.userId);
      const isFuture = ms.scheduledAt > now;
      if (existing) {
        existing.sessions.totalSessions += 1;
        if (isFuture) {
          if (!existing.sessions.nextSessionAt || ms.scheduledAt < existing.sessions.nextSessionAt) {
            existing.sessions.nextSessionAt = ms.scheduledAt;
          }
        } else if (
          !existing.sessions.lastSessionAt ||
          ms.scheduledAt > existing.sessions.lastSessionAt
        ) {
          existing.sessions.lastSessionAt = ms.scheduledAt;
        }
        if (ms.scheduledAt > existing.sessions.lastActivity) {
          existing.sessions.lastActivity = ms.scheduledAt;
        }
      } else {
        menteeMap.set(ms.userId, {
          id: ms.user.id,
          name: ms.user.name,
          email: showMenteeEmail ? ms.user.email : null,
          image: ms.user.image,
          sessions: {
            lastSessionAt: isFuture ? null : ms.scheduledAt,
            nextSessionAt: isFuture ? ms.scheduledAt : null,
            totalSessions: 1,
            lastActivity: ms.scheduledAt,
          },
        });
      }
    }

    const mentees: MenteeDto[] = Array.from(menteeMap.values())
      .sort((a, b) => b.sessions.lastActivity.getTime() - a.sessions.lastActivity.getTime())
      .map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
        sessions: {
          lastSessionAt: m.sessions.lastSessionAt ? m.sessions.lastSessionAt.toISOString() : null,
          nextSessionAt: m.sessions.nextSessionAt ? m.sessions.nextSessionAt.toISOString() : null,
          totalSessions: m.sessions.totalSessions,
          status: m.sessions.lastActivity >= ninetyDaysAgo ? 'active' : 'inactive',
        },
      }));

    const resourceDtos: MentorResourceDto[] = resources.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url,
      fileUrl: r.fileUrl,
      isPublic: r.isPublic,
      downloads: r.downloads,
      sharedAt: r.createdAt.toISOString(),
    }));

    const reviewDtos: MentorReviewDto[] = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewer: r.isAnonymous ? null : r.user?.name ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    const dto: MentorDashboardDto = {
      mentor: {
        id: mentor.id,
        name: mentor.name,
        isCertified: mentor.isCertified,
        isActive: mentor.isActive,
      },
      mentees,
      resources: resourceDtos,
      recentReviews: reviewDtos,
      totals: {
        activeMentees: mentees.filter(m => m.sessions.status === 'active').length,
        totalSessions: sessionsAll.length,
        upcomingSessions: upcomingCount,
        averageRating: mentor.rating,
      },
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error('[MENTOR_DASHBOARD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
