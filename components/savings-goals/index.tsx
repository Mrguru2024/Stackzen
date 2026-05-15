import React from 'react';
import { prisma } from '@/lib/prisma';

export type SavingsGoalsProps = Record<string, never>;

export default async function SavingsGoals({}: SavingsGoalsProps) {
  // Fetch user's savings goals from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { savingsGoals: true } });
  const savingsGoals = user?.savingsGoals ?? [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Savings Goals</h1>
      <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Add New Goal</h2>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="goalName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Goal Name
            </label>
            <input
              type="text"
              id="goalName"
              placeholder="Enter goal name"
              className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="targetAmount"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Target Amount
            </label>
            <input
              type="number"
              id="targetAmount"
              placeholder="Enter target amount"
              className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Add Goal
          </button>
        </form>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Your Goals</h2>
        <div className="space-y-4">
          {savingsGoals.length > 0 ? (
            savingsGoals.map((goal: any) => (
              <div key={goal.id} className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-medium dark:text-white">{goal.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2.5 rounded-full bg-primary"
                    style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              No savings goals found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
