import { NextResponse } from 'next/server';
import { startOfMonth } from 'date-fns';
import { JobStatus } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export interface IncomeBySourceItem {
  jobTag: string;
  amount: number;
  count: number;
}

export interface IncomeBySourceResponse {
  items: IncomeBySourceItem[];
  totalIncome: number;
  rangeStart: string;
  rangeEnd: string;
  hasData: boolean;
}

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const url = new URL(request.url);
    const monthsParam = Number(url.searchParams.get('months') ?? '3');
    const monthsBack = Number.isFinite(monthsParam) && monthsParam > 0 ? Math.min(monthsParam, 24) : 3;

    const now = new Date();
    const rangeStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1));

    const [jobs, ledgerRows, paidInvoices] = await Promise.all([
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
          id: true,
          title: true,
          sourceLabel: true,
          jobRevenue: true,
          workType: true,
          status: true,
        },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: rangeStart } },
        select: { amount: true, source: true },
      }),
      prisma.invoice.findMany({
        where: { userId, status: 'paid', paidAt: { gte: rangeStart } },
        select: { amount: true, jobTag: true, jobId: true },
      }),
    ]);

    const buckets = new Map<string, { amount: number; count: number }>();

    for (const job of jobs) {
      const tag =
        job.sourceLabel?.trim() ||
        (job.workType ? job.workType.replace(/_/g, ' ').toLowerCase() : null) ||
        job.title ||
        'Other jobs';
      const bucket = buckets.get(tag) ?? { amount: 0, count: 0 };
      bucket.amount += job.jobRevenue ?? 0;
      bucket.count += 1;
      buckets.set(tag, bucket);
    }

    for (const row of ledgerRows) {
      const tag = row.source?.trim() || 'Manual income';
      const bucket = buckets.get(tag) ?? { amount: 0, count: 0 };
      bucket.amount += row.amount;
      bucket.count += 1;
      buckets.set(tag, bucket);
    }

    for (const invoice of paidInvoices) {
      if (invoice.jobId) continue;
      const tag = invoice.jobTag?.trim() || 'Standalone invoices';
      const bucket = buckets.get(tag) ?? { amount: 0, count: 0 };
      bucket.amount += invoice.amount;
      bucket.count += 1;
      buckets.set(tag, bucket);
    }

    const items: IncomeBySourceItem[] = Array.from(buckets.entries())
      .map(([jobTag, b]) => ({ jobTag, amount: Math.round(b.amount * 100) / 100, count: b.count }))
      .sort((a, b) => b.amount - a.amount);

    const totalIncome = items.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json<IncomeBySourceResponse>({
      items,
      totalIncome,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: now.toISOString(),
      hasData: items.length > 0,
    });
  } catch (error) {
    console.error('[INCOME_BY_SOURCE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
