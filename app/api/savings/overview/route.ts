import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import {
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export interface SavingsAccountDto {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  institution: string | null;
  isConnected: boolean;
}

export interface SavingsGoalDto {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: string | null;
  progress: number;
}

export interface SavingsActivityDto {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  description: string;
}

export interface SavingsOverviewDto {
  totalSavings: number;
  monthlySavings: number;
  monthlyTarget: number;
  yearToDate: number;
  projectedAnnual: number;
  savingsRate: number;
  goalsProgress: number;
  challengesCompleted: number;
  activeGoals: number;
  accounts: SavingsAccountDto[];
  goals: SavingsGoalDto[];
  recentActivity: SavingsActivityDto[];
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
    const ytdStart = startOfYear(now);

    const [
      accounts,
      activeGoalRows,
      activeChallenges,
      challengesCompleted,
      monthIncome,
      monthOutflow,
      ytdSavingsExecutions,
      ytdIncome,
      recentExecutions,
    ] = await Promise.all([
      prisma.savingsAccount.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savingsGoal.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savingsChallenge.count({ where: { userId, isActive: true } }),
      prisma.savingsChallenge.count({ where: { userId, isActive: false } }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          postedAt: { gte: monthStart, lte: monthEnd },
          direction: FinancialTransactionDirection.INFLOW,
          source: FinancialTransactionSource.PLAID_SYNC,
          isTransfer: false,
          category: { kind: TransactionCategoryKind.INCOME },
        },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          postedAt: { gte: monthStart, lte: monthEnd },
          direction: FinancialTransactionDirection.OUTFLOW,
          isTransfer: false,
        },
      }),
      prisma.savingsExecution.aggregate({
        _sum: { amount: true },
        where: { userId, executedAt: { gte: ytdStart } },
      }),
      prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          postedAt: { gte: ytdStart },
          direction: FinancialTransactionDirection.INFLOW,
          source: FinancialTransactionSource.PLAID_SYNC,
          isTransfer: false,
          category: { kind: TransactionCategoryKind.INCOME },
        },
      }),
      prisma.savingsExecution.findMany({
        where: { userId },
        orderBy: { executedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          executedAt: true,
          description: true,
          rule: { select: { name: true, type: true } },
        },
      }),
    ]);

    const totalSavings = accounts.reduce((sum, a) => sum + a.balance, 0);

    const incomeThisMonth = monthIncome._sum.amount ?? 0;
    const outflowThisMonth = Math.abs(monthOutflow._sum.amount ?? 0);
    const monthlySavings = Math.max(0, incomeThisMonth - outflowThisMonth);

    const monthlyTarget = activeGoalRows.reduce((sum, g) => {
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      if (!g.targetDate) return sum + remaining / 12;
      const monthsLeft = Math.max(
        1,
        Math.ceil((g.targetDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000))
      );
      return sum + remaining / monthsLeft;
    }, 0);

    const ytdSaved = ytdSavingsExecutions._sum.amount ?? monthlySavings;
    const ytdIncomeTotal = ytdIncome._sum.amount ?? 0;
    const monthsElapsed = Math.max(1, now.getMonth() + 1);
    const projectedAnnual = (ytdSaved / monthsElapsed) * 12;
    const savingsRate = ytdIncomeTotal > 0 ? (ytdSaved / ytdIncomeTotal) * 100 : 0;

    const goals: SavingsGoalDto[] = activeGoalRows.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      category: g.category,
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
      progress: g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0,
    }));

    const goalsProgress =
      goals.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0;

    const accountsDto: SavingsAccountDto[] = accounts.map(a => ({
      id: a.id,
      name: a.name,
      balance: a.balance,
      interestRate: a.interestRate,
      institution: a.institution,
      isConnected: a.isConnected,
    }));

    const recentActivity: SavingsActivityDto[] = recentExecutions.map(e => ({
      id: e.id,
      type: e.amount >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(e.amount),
      date: e.executedAt.toISOString(),
      description:
        e.description?.trim() ||
        e.rule?.name ||
        `Automated saving (${e.rule?.type ?? 'rule'})`,
    }));

    const dto: SavingsOverviewDto = {
      totalSavings: Math.round(totalSavings * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      monthlyTarget: Math.round(monthlyTarget * 100) / 100,
      yearToDate: Math.round(ytdSaved * 100) / 100,
      projectedAnnual: Math.round(projectedAnnual * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      goalsProgress: Math.round(goalsProgress * 10) / 10,
      challengesCompleted,
      activeGoals: activeChallenges + goals.length,
      accounts: accountsDto,
      goals,
      recentActivity,
      hasData: accounts.length > 0 || goals.length > 0 || recentActivity.length > 0,
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error('[SAVINGS_OVERVIEW]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
