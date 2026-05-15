'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface SafeToSpendData {
  totalIncome: number;
  totalExpenses: number;
  upcomingBills: number;
  savingsGoals: number;
  safeToSpend: number;
  hasData: boolean;
  generatedAt: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

function getStatusMessage(safeToSpend: number, hasData: boolean): string {
  if (!hasData) return 'Connect your accounts to see your weekly safe-to-spend.';
  if (safeToSpend > 2000) return "You're in great shape this month";
  if (safeToSpend > 500) return "You're tracking well — keep it up";
  if (safeToSpend > 0) return 'Be cautious with new spending this week';
  return 'Spending is outpacing income — review bills and savings targets';
}

function getStatusColor(safeToSpend: number, hasData: boolean): string {
  if (!hasData) return 'text-muted-foreground';
  if (safeToSpend > 2000) return 'text-green-600 dark:text-green-400';
  if (safeToSpend > 500) return 'text-yellow-600 dark:text-yellow-400';
  if (safeToSpend > 0) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

const SafeToSpend: React.FC = () => {
  const { status } = useSession();
  const query = useQuery<SafeToSpendData, Error>({
    queryKey: ['safe-to-spend'],
    queryFn: async () => {
      const res = await fetch('/api/safe-to-spend', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load safe-to-spend (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  if (status === 'unauthenticated') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Safe to Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sign in to see your safe-to-spend.</p>
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Safe to Spend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="mx-auto h-10 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (query.error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Safe to Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{query.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const data = query.data ?? {
    totalIncome: 0,
    totalExpenses: 0,
    upcomingBills: 0,
    savingsGoals: 0,
    safeToSpend: 0,
    hasData: false,
    generatedAt: new Date().toISOString(),
  };
  const { safeToSpend, totalIncome, totalExpenses, upcomingBills, savingsGoals, hasData } = data;
  const utilization = totalIncome > 0 ? Math.min(100, (safeToSpend / totalIncome) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Safe to Spend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getStatusColor(safeToSpend, hasData)}`}>
            {formatCurrency(safeToSpend)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {getStatusMessage(safeToSpend, hasData)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Income
            </span>
            <span className="font-medium">+{formatCurrency(totalIncome)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Expenses
            </span>
            <span className="font-medium">-{formatCurrency(totalExpenses)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Upcoming Bills (30d)
            </span>
            <span className="font-medium">-{formatCurrency(upcomingBills)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Savings Goals (monthly target)
            </span>
            <span className="font-medium">-{formatCurrency(savingsGoals)}</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Spending headroom</span>
            <span>{utilization.toFixed(1)}%</span>
          </div>
          <Progress value={utilization} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SafeToSpend;
