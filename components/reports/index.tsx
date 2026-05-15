import React from 'react';
import { prisma } from '@/lib/prisma';

export type ReportsProps = Record<string, never>;

export default async function Reports({}: ReportsProps) {
  // Fetch summary data
  const [income, expenses] = await Promise.all([
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  // Fetch monthly breakdowns (group by month)
  const incomeByMonth = await prisma.income.groupBy({
    by: ['date'],
    _sum: { amount: true },
    orderBy: { date: 'desc' },
  });
  const expenseByMonth = await prisma.expense.groupBy({
    by: ['date'],
    _sum: { amount: true },
    orderBy: { date: 'desc' },
  });

  // Merge months
  const months = Array.from(
    new Set([
      ...incomeByMonth.map(i => i.date.toISOString().slice(0, 7)),
      ...expenseByMonth.map(e => e.date.toISOString().slice(0, 7)),
    ])
  )
    .sort()
    .reverse();

  const monthlyRows = months.map(month => {
    const incomeRow = incomeByMonth.find(i => i.date.toISOString().slice(0, 7) === month);
    const expenseRow = expenseByMonth.find(e => e.date.toISOString().slice(0, 7) === month);
    return {
      month,
      income: incomeRow?._sum.amount ?? 0,
      expenses: expenseRow?._sum.amount ?? 0,
      net: (incomeRow?._sum.amount ?? 0) - (expenseRow?._sum.amount ?? 0),
    };
  });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Reports</h1>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Total Income</h2>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${income._sum.amount?.toFixed(2) ?? '0.00'}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Total Expenses</h2>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${expenses._sum.amount?.toFixed(2) ?? '0.00'}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Net Savings</h2>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${((income._sum.amount ?? 0) - (expenses._sum.amount ?? 0)).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Month</th>
                <th className="px-4 py-2 text-left">Income</th>
                <th className="px-4 py-2 text-left">Expenses</th>
                <th className="px-4 py-2 text-left">Net</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map(row => (
                <tr key={row.month} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{row.month}</td>
                  <td className="px-4 py-2 text-green-600 dark:text-green-400">
                    ${row.income.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-red-600 dark:text-red-400">
                    ${row.expenses.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-blue-600 dark:text-blue-400">
                    ${row.net.toFixed(2)}
                  </td>
                </tr>
              ))}
              {monthlyRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
