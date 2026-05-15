import { NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';
import { addDays, format, startOfDay } from 'date-fns';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export interface IncomeTimelinePoint {
  date: string;
  [source: string]: string | number;
}

export interface IncomeTimelineResponse {
  series: IncomeTimelinePoint[];
  sources: string[];
  hasData: boolean;
  rangeStart: string;
  rangeEnd: string;
}

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get('days') ?? '30');
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;

    const now = new Date();
    const rangeStart = startOfDay(addDays(now, -(days - 1)));

    const [jobs, ledgerRows] = await Promise.all([
      prisma.job.findMany({
        where: {
          userId,
          status: {
            in: [
              JobStatus.IN_PROGRESS,
              JobStatus.AWAITING_PAYMENT,
              JobStatus.PAID,
              JobStatus.COMPLETED,
              JobStatus.CLOSED,
            ],
          },
          updatedAt: { gte: rangeStart },
        },
        select: {
          updatedAt: true,
          jobRevenue: true,
          sourceLabel: true,
          workType: true,
          title: true,
        },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: rangeStart } },
        select: { date: true, amount: true, source: true },
      }),
    ]);

    const sources = new Set<string>();
    const dailyMap = new Map<string, Record<string, number>>();

    function bumpDay(date: Date, source: string, amount: number) {
      const key = format(startOfDay(date), 'yyyy-MM-dd');
      const dayRecord = dailyMap.get(key) ?? {};
      dayRecord[source] = (dayRecord[source] ?? 0) + amount;
      dailyMap.set(key, dayRecord);
      sources.add(source);
    }

    for (const job of jobs) {
      const source =
        job.sourceLabel?.trim() ||
        (job.workType ? job.workType.replace(/_/g, ' ').toLowerCase() : null) ||
        job.title ||
        'Other jobs';
      bumpDay(job.updatedAt, source, job.jobRevenue ?? 0);
    }

    for (const row of ledgerRows) {
      const source = row.source?.trim() || 'Manual income';
      bumpDay(row.date, source, row.amount);
    }

    const series: IncomeTimelinePoint[] = [];
    for (let i = 0; i < days; i++) {
      const day = startOfDay(addDays(rangeStart, i));
      const key = format(day, 'yyyy-MM-dd');
      const dayRecord = dailyMap.get(key) ?? {};
      const point: IncomeTimelinePoint = { date: key };
      for (const src of sources) {
        point[src] = dayRecord[src] ?? 0;
      }
      series.push(point);
    }

    return NextResponse.json<IncomeTimelineResponse>({
      series,
      sources: Array.from(sources),
      hasData: sources.size > 0,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: now.toISOString(),
    });
  } catch (error) {
    console.error('[INCOME_TIMELINE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
