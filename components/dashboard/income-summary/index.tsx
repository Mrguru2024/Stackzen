import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const _mockSummary = {
  totalIncome: 5200,
  totalExpenses: 3100,
  netBalance: 2100,
};

export default function IncomeSummary({
  summary = _mockSummary,
}: {
  summary?: { totalIncome: number; totalExpenses: number; netBalance: number };
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex flex-col items-start p-6">
          <span className="mb-1 text-sm text-muted-foreground">Total Income</span>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${summary.totalIncome.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-start p-6">
          <span className="mb-1 text-sm text-muted-foreground">Total Expenses</span>
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-red-500" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${summary.totalExpenses.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-start p-6">
          <span className="mb-1 text-sm text-muted-foreground">Net Balance</span>
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-6 w-6 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${summary.netBalance.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
