import React from 'react';
import { prisma } from '@/lib/prisma';

export type BudgetPlannerProps = Record<string, never>;

export default async function BudgetPlanner({}: BudgetPlannerProps) {
  // Fetch user's budget from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { budget: true } });
  const budget = user?.budget || [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Budget Planner</h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Budget Summary</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Budget: ${budget.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </p>
        </div>
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Budget Breakdown</h2>
        <div className="mb-4 h-64 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {budget.length > 0 ? (
            budget.map(item => (
              <div key={item.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${item.amount.toFixed(2)} - {item.category}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No budget items yet.</p>
          )}
        </div>
        <button className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary">
          Add Budget Item
        </button>
      </div>
    </div>
  );
}
