import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';

export interface SafeToSpendDto {
  totalIncome: number;
  totalExpenses: number;
  upcomingBills: number;
  savingsGoals: number;
  safeToSpend: number;
  hasData: boolean;
  generatedAt: string;
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [bookings, ledger, bankInflow, bankOutflow, savingsGoals, forecast] = await Promise.all([
      prisma.booking.findMany({
        where: { userId, status: 'completed', date: { gte: monthStart, lte: monthEnd } },
        select: { service: { select: { price: true } } },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        select: { amount: true },
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId,
          postedAt: { gte: monthStart, lte: monthEnd },
          direction: FinancialTransactionDirection.INFLOW,
          source: FinancialTransactionSource.PLAID_SYNC,
          isTransfer: false,
          category: { kind: TransactionCategoryKind.INCOME },
        },
        select: { amount: true },
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId,
          postedAt: { gte: monthStart, lte: monthEnd },
          direction: FinancialTransactionDirection.OUTFLOW,
          isTransfer: false,
        },
        select: { amount: true },
      }),
      prisma.savingsGoal.findMany({
        where: { userId, isActive: true },
        select: { targetAmount: true, currentAmount: true, targetDate: true },
      }),
      buildCashFlowForecast(userId, { includeDetails: false }),
    ]);

    const bookingTotal = bookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0);
    const ledgerTotal = ledger.reduce((sum, r) => sum + r.amount, 0);
    const bankIncomeTotal = bankInflow.reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = bookingTotal + ledgerTotal + bankIncomeTotal;

    const totalExpenses = bankOutflow.reduce((sum, r) => sum + Math.abs(r.amount), 0);

    const window30 = forecast.windows.find(w => w.windowDays === 30);
    const upcomingBills = window30?.expectedBillsTotal ?? 0;

    const monthlySavingsTarget = savingsGoals.reduce((sum, g) => {
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      if (!g.targetDate) return sum + remaining / 12;
      const monthsLeft = Math.max(
        1,
        Math.ceil((g.targetDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000))
      );
      return sum + remaining / monthsLeft;
    }, 0);

    const safeToSpend = Math.max(
      0,
      totalIncome - totalExpenses - upcomingBills - monthlySavingsTarget
    );

    const dto: SafeToSpendDto = {
      totalIncome,
      totalExpenses,
      upcomingBills,
      savingsGoals: monthlySavingsTarget,
      safeToSpend,
      hasData: totalIncome > 0 || totalExpenses > 0 || savingsGoals.length > 0,
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error('[SAFE_TO_SPEND]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
