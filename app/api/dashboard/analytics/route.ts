import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { sumUserInflowRevenue, pctChange } from '@/lib/analytics/user-revenue';

interface AnalyticsResponse {
  totalRevenue: number;
  activeClients: number;
  pendingInvoices: number;
  growthRate: number;
  revenueChange: number;
  clientsChange: number;
  invoicesChange: number;
  growthChange: number;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const now = new Date();
    const currentStart = startOfMonth(now);
    const currentEnd = endOfMonth(now);
    const priorStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const priorEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const ninetyDayCutoffCurrent = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const ninetyDayCutoffPrior = new Date(priorEnd.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      currentRevenue,
      priorRevenue,
      activeClients,
      priorClients,
      pendingInvoices,
      priorPendingInvoices,
    ] = await Promise.all([
      sumUserInflowRevenue(userId, currentStart, currentEnd),
      sumUserInflowRevenue(userId, priorStart, priorEnd),
      prisma.client.count({
        where: {
          userId,
          OR: [
            { invoices: { some: { createdAt: { gte: ninetyDayCutoffCurrent } } } },
            { jobs: { some: { createdAt: { gte: ninetyDayCutoffCurrent } } } },
          ],
        },
      }),
      prisma.client.count({
        where: {
          userId,
          createdAt: { lte: priorEnd },
          OR: [
            {
              invoices: {
                some: { createdAt: { gte: ninetyDayCutoffPrior, lte: priorEnd } },
              },
            },
            {
              jobs: {
                some: { createdAt: { gte: ninetyDayCutoffPrior, lte: priorEnd } },
              },
            },
          ],
        },
      }),
      prisma.invoice.count({
        where: { userId, status: { in: ['pending', 'sent', 'overdue'] } },
      }),
      prisma.invoice.count({
        where: {
          userId,
          status: { in: ['pending', 'sent', 'overdue'] },
          createdAt: { lte: priorEnd },
        },
      }),
    ]);

    const data: AnalyticsResponse = {
      totalRevenue: Math.round(currentRevenue * 100) / 100,
      activeClients,
      pendingInvoices,
      growthRate: pctChange(currentRevenue, priorRevenue),
      revenueChange: pctChange(currentRevenue, priorRevenue),
      clientsChange: pctChange(activeClients, priorClients),
      invoicesChange: pendingInvoices - priorPendingInvoices,
      growthChange: pctChange(currentRevenue, priorRevenue),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[DASHBOARD_ANALYTICS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
