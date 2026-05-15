import {
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Sum recognized inflow for a user between `from` and `to` (inclusive of dates on bookings/income; postedAt on bank tx). */
export async function sumUserInflowRevenue(userId: string, from: Date, to: Date): Promise<number> {
  const [bookings, ledger, bankInflow] = await Promise.all([
    prisma.booking.findMany({
      where: { userId, status: 'completed', date: { gte: from, lte: to } },
      select: { service: { select: { price: true } } },
    }),
    prisma.income.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { amount: true },
    }),
    prisma.financialTransaction.findMany({
      where: {
        userId,
        postedAt: { gte: from, lte: to },
        direction: FinancialTransactionDirection.INFLOW,
        source: FinancialTransactionSource.PLAID_SYNC,
        isTransfer: false,
        category: { kind: TransactionCategoryKind.INCOME },
      },
      select: { amount: true },
    }),
  ]);

  const bookingTotal = bookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0);
  const ledgerTotal = ledger.reduce((sum, r) => sum + r.amount, 0);
  const bankTotal = bankInflow.reduce((sum, r) => sum + r.amount, 0);
  return Math.round((bookingTotal + ledgerTotal + bankTotal) * 100) / 100;
}

export function parseAnalyticsTimeRange(
  raw: string | null
): { key: '7d' | '30d' | '90d' | '1y'; startDate: Date; now: Date } {
  const now = new Date();
  const key: '7d' | '30d' | '90d' | '1y' =
    raw === '7d' || raw === '30d' || raw === '90d' || raw === '1y' ? raw : '30d';
  let days = 30;
  if (key === '7d') days = 7;
  else if (key === '90d') days = 90;
  else if (key === '1y') days = 365;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { key, startDate, now };
}

export function priorWindow(startDate: Date, now: Date): { priorStart: Date; priorEnd: Date } {
  const periodMs = now.getTime() - startDate.getTime();
  const priorEnd = new Date(startDate);
  const priorStart = new Date(startDate.getTime() - periodMs);
  return { priorStart, priorEnd };
}

export function pctChange(current: number, prior: number): number {
  if (!Number.isFinite(prior) || prior === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - prior) / prior) * 1000) / 10;
}
