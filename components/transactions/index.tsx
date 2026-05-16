import React from 'react';
import { prisma } from '@/lib/prisma';

export type TransactionsProps = Record<string, never>;

export default async function Transactions({}: TransactionsProps) {
  // Fetch transactions from the database (combine income and expenses)
  const [income, expenses] = await Promise.all([
    prisma.income.findMany({ orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' } }),
  ]);

  // Merge and sort by date
  const transactions = [
    ...income.map(t => ({ ...t, type: 'Income' as const })),
    ...expenses.map(t => ({ ...t, type: 'Expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Transactions</h1>
      {/* Filter dropdown (UI only, no logic yet) */}
      <div className="mb-4 flex items-center gap-2">
        <label
          htmlFor="type-filter"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Filter:
        </label>
        <select
          id="type-filter"
          className="rounded border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
          defaultValue="all"
          aria-label="Filter transactions by type"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-900">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">
                  <span
                    className={
                      tx.type === 'Income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {tx.type === 'Income'
                    ? [tx.source, tx.notes].filter(Boolean).join(' — ') || '—'
                    : tx.description}
                </td>
                <td className="px-4 py-2">${tx.amount.toFixed(2)}</td>
                <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
