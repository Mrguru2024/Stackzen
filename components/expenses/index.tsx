import React from 'react';
import { Suspense } from 'react';
import { ExpenseDialog } from './expense-dialog';
import { prisma } from '@/lib/prisma';

export default async function Expenses() {
  // Fetch expenses from the database
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: { user: true },
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Expenses</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ExpenseDialog />
      </Suspense>
      <div className="mt-8">
        <table className="min-w-full overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{expense.description}</td>
                <td className="px-4 py-2">{expense.category}</td>
                <td className="px-4 py-2">${expense.amount.toFixed(2)}</td>
                <td className="px-4 py-2">{new Date(expense.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
