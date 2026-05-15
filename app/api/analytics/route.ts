import { NextRequest, NextResponse } from 'next/server';
import { SessionStatus, UserRole } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { parseAnalyticsTimeRange, pctChange, priorWindow } from '@/lib/analytics/user-revenue';

const COUNTABLE: SessionStatus[] = [SessionStatus.COMPLETED, SessionStatus.CONFIRMED];

function aggregateSpecialties(
  rows: { mentor: { specialties: string[] } }[]
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const specs = row.mentor.specialties?.length ? row.mentor.specialties : ['General'];
    for (const label of specs) {
      map.set(label, (map.get(label) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { key, startDate, now } = parseAnalyticsTimeRange(searchParams.get('timeRange'));
  const { priorStart, priorEnd } = priorWindow(startDate, now);

  try {
    const [
      totalSessions,
      totalRevenue,
      activeMentors,
      pendingApplications,
      averageRating,
      monthlySessions,
      mentorPerformance,
      priorSessionsCount,
      priorRevenueAgg,
      specialtyRows,
    ] = await Promise.all([
      prisma.mentorSession.count({
        where: {
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
      }),
      prisma.mentorSession.aggregate({
        where: {
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
        _sum: { price: true },
      }),
      prisma.mentor.count({
        where: {
          sessions: {
            some: {
              scheduledAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), lte: now },
            },
          },
          isActive: true,
        },
      }),
      prisma.mentor.count({
        where: { isActive: true, isVerified: false },
      }),
      prisma.mentorSession.aggregate({
        where: {
          scheduledAt: { gte: startDate, lte: now },
          status: SessionStatus.COMPLETED,
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
      prisma.mentorSession.groupBy({
        by: ['scheduledAt'],
        where: {
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
        _count: { id: true },
        _sum: { price: true },
      }),
      prisma.mentor.findMany({
        where: {
          sessions: {
            some: {
              scheduledAt: { gte: startDate, lte: now },
              status: { in: COUNTABLE },
            },
          },
        },
        include: {
          user: { select: { name: true } },
          sessions: {
            where: {
              scheduledAt: { gte: startDate, lte: now },
              status: { in: COUNTABLE },
            },
            select: { price: true, rating: true },
          },
        },
        take: 25,
      }),
      prisma.mentorSession.count({
        where: {
          scheduledAt: { gte: priorStart, lte: priorEnd },
          status: { in: COUNTABLE },
        },
      }),
      prisma.mentorSession.aggregate({
        where: {
          scheduledAt: { gte: priorStart, lte: priorEnd },
          status: { in: COUNTABLE },
        },
        _sum: { price: true },
      }),
      prisma.mentorSession.findMany({
        where: {
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
        select: { mentor: { select: { specialties: true } } },
      }),
    ]);

    const monthlyData = monthlySessions.reduce(
      (acc, row) => {
        const month = row.scheduledAt.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { sessions: 0, revenue: 0 };
        }
        acc[month].sessions += row._count.id;
        acc[month].revenue += row._sum.price || 0;
        return acc;
      },
      {} as Record<string, { sessions: number; revenue: number }>
    );

    const monthlySorted = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, data]) => ({
        monthKey: ym,
        month: new Date(`${ym}-01T12:00:00.000Z`).toLocaleDateString('en-US', { month: 'short' }),
        sessions: data.sessions,
        revenue: Math.round(data.revenue * 100) / 100,
      }));

    const currentRevenue = totalRevenue._sum.price || 0;
    const priorRevenue = priorRevenueAgg._sum.price || 0;

    const processedMentorPerformance = mentorPerformance.map(m => ({
      name: m.user?.name || 'Unknown',
      sessions: m.sessions.length,
      rating: m.sessions.length
        ? Math.round(
            (m.sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / m.sessions.length) * 10
          ) / 10
        : 0,
      revenue: Math.round(m.sessions.reduce((sum, s) => sum + (s.price || 0), 0) * 100) / 100,
    }));

    const topSpecialties = aggregateSpecialties(specialtyRows);

    return NextResponse.json({
      scope: 'platform',
      timeRange: key,
      totalSessions,
      totalRevenue: Math.round(currentRevenue * 100) / 100,
      averageRating: averageRating._avg.rating
        ? Math.round(averageRating._avg.rating * 10) / 10
        : 0,
      activeMentors,
      pendingApplications,
      sessionGrowth: pctChange(totalSessions, priorSessionsCount),
      revenueGrowth: pctChange(currentRevenue, priorRevenue),
      monthlySessions: monthlySorted,
      topSpecialties,
      mentorPerformance: processedMentorPerformance.sort((a, b) => b.revenue - a.revenue),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
