import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const _mockIncome = [
  { id: 1, date: '2025-06-01', source: 'Freelance Project', amount: 1200 },
  { id: 2, date: '2025-06-05', source: 'Consulting', amount: 800 },
  { id: 3, date: '2025-06-10', source: 'Online Course', amount: 500 },
  { id: 4, date: '2025-06-15', source: 'Affiliate', amount: 300 },
  { id: 5, date: '2025-06-20', source: 'Other', amount: 200 },
];

export default function IncomeList({
  income = _mockIncome,
}: {
  income?: { id: number; date: string; source: string; amount: number }[];
}) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Income</h3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {income.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No income entries found.</div>
          ) : (
            income.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{item.source}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  ${item.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
