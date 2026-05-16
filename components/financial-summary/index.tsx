import React from 'react';
import { prisma } from '@/lib/prisma';

export type FinancialSummaryProps = Record<string, never>;

export default async function FinancialSummary({}: FinancialSummaryProps) {
  // Fetch user's financial data from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({
    include: { incomes: true, expenses: true },
  });
  const incomeHistory = user?.incomes ?? [];
  const expenseHistory = user?.expenses ?? [];

  // Calculate summary stats
  const totalIncome = incomeHistory.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseHistory.reduce((sum, entry) => sum + entry.amount, 0);
  const savings = totalIncome - totalExpenses;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Summary</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Total Income</h2>
          <p className="dark:text-primary-light text-2xl font-bold text-primary">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Total Expenses</h2>
          <p className="dark:text-primary-light text-2xl font-bold text-primary">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
          <h2 className="mb-2 text-lg font-semibold dark:text-white">Savings</h2>
          <p className="dark:text-primary-light text-2xl font-bold text-primary">
            ${savings.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Financial Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Category</th>
                <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-2 py-2 dark:text-white">Income</td>
                <td className="px-2 py-2 dark:text-white">${totalIncome.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-2 py-2 dark:text-white">Expenses</td>
                <td className="px-2 py-2 dark:text-white">${totalExpenses.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-2 py-2 dark:text-white">Savings</td>
                <td className="px-2 py-2 dark:text-white">${savings.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
