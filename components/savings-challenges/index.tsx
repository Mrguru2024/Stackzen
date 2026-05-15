import React from 'react';
import { prisma } from '@/lib/prisma';

export type SavingsChallengesProps = Record<string, never>;

export default async function SavingsChallenges({}: SavingsChallengesProps) {
  // Fetch savings challenges from the database (placeholder, adjust model as needed)
  const challenges = await prisma.savingsChallenge.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Savings Challenges</h1>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300">
          Active Challenges: {challenges.length}
        </span>
        <button
          className="hover:bg-primary-dark rounded bg-primary px-4 py-2 text-white transition-colors"
          aria-label="Start New Challenge"
        >
          + Start New Challenge
        </button>
      </div>
      <div className="space-y-6">
        {challenges.map(challenge => {
          const percent = Math.min(
            100,
            Math.round((challenge.currentAmount / challenge.targetAmount) * 100)
          );
          return (
            <div key={challenge.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-semibold dark:text-white">{challenge.title}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{percent}%</span>
              </div>
              <div className="mb-2 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Saved: ${challenge.currentAmount.toFixed(2)}</span>
                <span>Goal: ${challenge.targetAmount.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        {challenges.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No savings challenges yet. Start one!
          </div>
        )}
      </div>
    </div>
  );
}
