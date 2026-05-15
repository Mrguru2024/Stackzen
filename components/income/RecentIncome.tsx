'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface IncomeTransaction {
  id: string;
  amount: number;
  source: string;
  category: string;
  date: string;
  isRecurring: boolean;
}

export function RecentIncome() {
  const { data: recentIncome, isLoading } = useQuery<IncomeTransaction[]>({
    queryKey: ['/api/income/recent'],
    queryFn: async () => {
      const response = await fetch('/api/income?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch recent income');
      }
      return response.json();
    },
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Income</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const transactions = recentIncome || [
    {
      id: '1',
      amount: 2500,
      source: 'Monthly Salary',
      category: 'Salary',
      date: new Date().toISOString(),
      isRecurring: true,
    },
    {
      id: '2',
      amount: 500,
      source: 'Freelance Project',
      category: 'Freelance',
      date: new Date(Date.now() - 86400000).toISOString(),
      isRecurring: false,
    },
    {
      id: '3',
      amount: 200,
      source: 'Stock Dividends',
      category: 'Investments',
      date: new Date(Date.now() - 172800000).toISOString(),
      isRecurring: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Income</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{transaction.source}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(transaction.date)} • {transaction.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(transaction.amount)}
                </span>
                {transaction.isRecurring && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Recurring
                  </span>
                )}
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
