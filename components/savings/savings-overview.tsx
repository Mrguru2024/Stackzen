'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { Badge } from '@/components/ui';
import { Icons } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function getSavingsRateColor(rate: number): string {
  if (rate >= 20) return 'text-green-600';
  if (rate >= 15) return 'text-yellow-600';
  return 'text-red-600';
}

export function SavingsOverview() {
  const { data, isLoading, error, isAuthenticated } = useSavingsOverview();

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Sign in to view your savings overview.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  const overview = data ?? {
    totalSavings: 0,
    monthlySavings: 0,
    monthlyTarget: 0,
    yearToDate: 0,
    projectedAnnual: 0,
    savingsRate: 0,
    goalsProgress: 0,
    challengesCompleted: 0,
    activeGoals: 0,
    accounts: [],
    goals: [],
    recentActivity: [],
    hasData: false,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <Icons.piggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalSavings)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(overview.monthlySavings)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSavingsRateColor(overview.savingsRate)}`}>
              {overview.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Target: 20% of income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
            <Icons.target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.goalsProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{overview.activeGoals} active goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges Won</CardTitle>
            <Icons.trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.challengesCompleted}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Savings Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Current: {formatCurrency(overview.monthlySavings)}
              </span>
              <span className="text-sm text-muted-foreground">
                Target: {formatCurrency(overview.monthlyTarget)}
              </span>
            </div>
            <Progress
              value={
                overview.monthlyTarget > 0
                  ? (overview.monthlySavings / overview.monthlyTarget) * 100
                  : 0
              }
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Year to Date: {formatCurrency(overview.yearToDate)}
              </span>
              <span className="text-muted-foreground">
                Projected: {formatCurrency(overview.projectedAnnual)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No savings accounts connected yet. Link a bank or add an account to get started.
              </p>
            ) : (
              overview.accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.interestRate}% APY {account.institution ? `· ${account.institution}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(account.balance)}</p>
                    <p className="text-sm text-muted-foreground">
                      +{formatCurrency(account.balance * (account.interestRate / 100 / 12))}/mo
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saving activity recorded yet. Once your automation rules run, executions will appear here.
            </p>
          ) : (
            <div className="space-y-4">
              {overview.recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`rounded-full p-2 ${
                        activity.type === 'deposit'
                          ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {activity.type === 'deposit' ? (
                        <Icons.arrowDown className="h-4 w-4" />
                      ) : (
                        <Icons.arrowUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {activity.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(activity.amount)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
