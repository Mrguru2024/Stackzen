import React from 'react';
import { prisma } from '@/lib/prisma';

export type FinancialDashboardProps = Record<string, never>;

export default async function FinancialDashboard({}: FinancialDashboardProps) {
  // Fetch user's financial data from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({
    include: { incomeHistory: true, expenseHistory: true, budget: true, savingsGoals: true },
  });
  const incomeHistory = user?.incomeHistory || [];
  const expenseHistory = user?.expenseHistory || [];
  const budget = user?.budget || [];
  const savingsGoals = user?.savingsGoals || [];

  const totalIncome = incomeHistory.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenseHistory.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budget.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Dashboard</h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Financial Summary</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Income: ${totalIncome.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Expenses: ${totalExpenses.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Budget: ${totalBudget.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Savings: ${totalSavings.toFixed(2)}
          </p>
        </div>
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Savings Goals</h2>
        <div className="mb-4 h-64 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {savingsGoals.length > 0 ? (
            savingsGoals.map(goal => (
              <div key={goal.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)} - {goal.name}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No savings goals yet.</p>
          )}
        </div>
        <button className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary">
          Add Savings Goal
        </button>
      </div>
    </div>
  );
}
