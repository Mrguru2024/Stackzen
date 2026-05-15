import { NextRequest, NextResponse } from 'next/server';
import { SessionStatus } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { parseAnalyticsTimeRange, pctChange, priorWindow } from '@/lib/analytics/user-revenue';

const COUNTABLE: SessionStatus[] = [SessionStatus.COMPLETED, SessionStatus.CONFIRMED];

function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function shortMonth(ym: string): string {
  const d = new Date(`${ym}-01T12:00:00.000Z`);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const userId = session.user.id;
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, specialties: true, rating: true },
  });

  if (!mentor) {
    return NextResponse.json({ error: 'Mentor profile required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { key, startDate, now } = parseAnalyticsTimeRange(searchParams.get('timeRange'));
  const { priorStart, priorEnd } = priorWindow(startDate, now);

  try {
    const [sessionsCurrent, sessionsPrior, reviewsAvg, monthlyRows] = await Promise.all([
      prisma.mentorSession.findMany({
        where: {
          mentorId: mentor.id,
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
        select: { scheduledAt: true, price: true, rating: true },
      }),
      prisma.mentorSession.findMany({
        where: {
          mentorId: mentor.id,
          scheduledAt: { gte: priorStart, lte: priorEnd },
          status: { in: COUNTABLE },
        },
        select: { price: true },
      }),
      prisma.mentorSession.aggregate({
        where: {
          mentorId: mentor.id,
          scheduledAt: { gte: startDate, lte: now },
          status: SessionStatus.COMPLETED,
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
      prisma.mentorSession.findMany({
        where: {
          mentorId: mentor.id,
          scheduledAt: { gte: startDate, lte: now },
          status: { in: COUNTABLE },
        },
        select: { scheduledAt: true, price: true },
      }),
    ]);

    const revenue = sessionsCurrent.reduce((s, x) => s + x.price, 0);
    const priorRevenue = sessionsPrior.reduce((s, x) => s + x.price, 0);
    const rated = reviewsAvg._avg.rating;
    const averageRating =
      rated != null && Number.isFinite(rated) ? Math.round(rated * 10) / 10 : mentor.rating ?? 0;

    const byMonth = new Map<string, { sessions: number; revenue: number }>();
    for (const row of monthlyRows) {
      const k = monthKey(row.scheduledAt);
      const cur = byMonth.get(k) ?? { sessions: 0, revenue: 0 };
      cur.sessions += 1;
      cur.revenue += row.price;
      byMonth.set(k, cur);
    }
    const monthlySessions = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, v]) => ({
        monthKey: ym,
        month: shortMonth(ym),
        sessions: v.sessions,
        revenue: Math.round(v.revenue * 100) / 100,
      }));

    const sessionCount = sessionsCurrent.length;

    return NextResponse.json({
      timeRange: key,
      profileSpecialties: mentor.specialties,
      totalSessions: sessionCount,
      totalRevenue: Math.round(revenue * 100) / 100,
      priorRevenue: Math.round(priorRevenue * 100) / 100,
      revenueGrowthPct: pctChange(revenue, priorRevenue),
      averageRating,
      monthlySessions,
      topSpecialties: [] as { name: string; count: number }[],
      mentorPerformance: [] as { name: string; sessions: number; rating: number; revenue: number }[],
    });
  } catch (e) {
    console.error('[ANALYTICS_MENTOR_PERSONAL]', e);
    return NextResponse.json({ error: 'Failed to load mentor analytics' }, { status: 500 });
  }
}
