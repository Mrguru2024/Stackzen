import React from 'react';
import { redirect } from 'next/navigation';
import {
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { startOfYear } from 'date-fns';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ScorecardProps = Record<string, never>;

export default async function Scorecard({}: ScorecardProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fwellness');
  }

  const userId = session.user.id;
  const ytdStart = startOfYear(new Date());

  const [incomeAgg, savingsAccounts, savingsGoals, latestWellness] = await Promise.all([
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
    prisma.savingsAccount.findMany({
      where: { userId },
      select: { balance: true },
    }),
    prisma.savingsGoal.findMany({
      where: { userId, isActive: true },
      select: { targetAmount: true, currentAmount: true },
    }),
    prisma.wellnessScore.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { totalScore: true, status: true, color: true, description: true },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ?? 0;
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const goalProgress = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const score = latestWellness?.totalScore ?? Math.round(Math.min(100, savingsRate * 4));
  const scoreColor =
    score >= 70
      ? 'text-green-600 dark:text-green-400'
      : score >= 40
        ? 'text-yellow-500 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Scorecard</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold dark:text-white">Score</span>
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}/100</span>
        </div>
        {latestWellness?.description ? (
          <p className="mb-4 text-sm text-muted-foreground">{latestWellness.description}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Income (YTD)</div>
            <div className="text-lg font-medium dark:text-white">${totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Savings Rate</div>
            <div className="text-lg font-medium dark:text-white">{savingsRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Savings</div>
            <div className="text-lg font-medium dark:text-white">${totalSavings.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Goal Progress</div>
            <div className="text-lg font-medium dark:text-white">
              ${goalProgress.toFixed(2)} / ${goalTarget.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
