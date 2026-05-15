import { NextRequest, NextResponse } from 'next/server';
import {
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  parseAnalyticsTimeRange,
  pctChange,
  priorWindow,
  sumUserInflowRevenue,
} from '@/lib/analytics/user-revenue';

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

  const { searchParams } = new URL(request.url);
  const { key, startDate, now } = parseAnalyticsTimeRange(searchParams.get('timeRange'));
  const { priorStart, priorEnd } = priorWindow(startDate, now);
  const userId = session.user.id;

  try {
    const [
      currentIncome,
      priorIncome,
      completedBookings,
      priorBookings,
      pendingInvoices,
      activeClients,
      bookingsForMonths,
      incomesForMonths,
      bankForMonths,
    ] = await Promise.all([
      sumUserInflowRevenue(userId, startDate, now),
      sumUserInflowRevenue(userId, priorStart, priorEnd),
      prisma.booking.count({
        where: { userId, status: 'completed', date: { gte: startDate, lte: now } },
      }),
      prisma.booking.count({
        where: { userId, status: 'completed', date: { gte: priorStart, lte: priorEnd } },
      }),
      prisma.invoice.count({
        where: { userId, status: { in: ['pending', 'sent', 'overdue'] } },
      }),
      prisma.client.count({
        where: {
          userId,
          OR: [
            { invoices: { some: { createdAt: { gte: startDate, lte: now } } } },
            { jobs: { some: { createdAt: { gte: startDate, lte: now } } } },
          ],
        },
      }),
      prisma.booking.findMany({
        where: { userId, status: 'completed', date: { gte: startDate, lte: now } },
        select: { date: true, service: { select: { price: true } } },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: startDate, lte: now } },
        select: { date: true, amount: true },
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId,
          postedAt: { gte: startDate, lte: now },
          direction: FinancialTransactionDirection.INFLOW,
          source: FinancialTransactionSource.PLAID_SYNC,
          isTransfer: false,
          category: { kind: TransactionCategoryKind.INCOME },
        },
        select: { postedAt: true, amount: true },
      }),
    ]);

    const byMonth = new Map<string, number>();
    for (const b of bookingsForMonths) {
      const k = monthKey(b.date);
      byMonth.set(k, (byMonth.get(k) ?? 0) + (b.service?.price ?? 0));
    }
    for (const row of incomesForMonths) {
      const k = monthKey(row.date);
      byMonth.set(k, (byMonth.get(k) ?? 0) + row.amount);
    }
    for (const row of bankForMonths) {
      const k = monthKey(row.postedAt);
      byMonth.set(k, (byMonth.get(k) ?? 0) + row.amount);
    }

    const monthlyIncome = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, income]) => ({
        monthKey: ym,
        month: shortMonth(ym),
        income: Math.round(income * 100) / 100,
      }));

    return NextResponse.json({
      timeRange: key,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      totalIncome: currentIncome,
      priorIncome,
      incomeGrowthPct: pctChange(currentIncome, priorIncome),
      completedBookings,
      priorCompletedBookings: priorBookings,
      bookingsGrowthPct: pctChange(completedBookings, priorBookings),
      pendingInvoices,
      activeClients,
      monthlyIncome,
    });
  } catch (e) {
    console.error('[ANALYTICS_PERSONAL]', e);
    return NextResponse.json({ error: 'Failed to load personal analytics' }, { status: 500 });
  }
}
