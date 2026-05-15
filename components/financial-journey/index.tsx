import React from 'react';
import { prisma } from '@/lib/prisma';

export type FinancialJourneyProps = Record<string, never>;

export default async function FinancialJourney({}: FinancialJourneyProps) {
  // Fetch milestones from the database (placeholder, adjust model as needed)
  const milestones = await prisma.financialMilestone.findMany({
    orderBy: { date: 'asc' },
  });

  const statusColor = {
    completed: 'bg-green-500',
    'in progress': 'bg-yellow-500',
    upcoming: 'bg-gray-400',
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Journey</h1>
      <ol className="relative border-l border-gray-300 dark:border-gray-700">
        {milestones.map(m => (
          <li key={m.id} className="mb-10 ml-6">
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900 ${
                statusColor[m.status] || 'bg-gray-400'
              }`}
            ></span>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">{m.name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{m.status}</span>
              </div>
              <time className="mt-2 text-sm text-gray-400 dark:text-gray-500 md:mt-0">
                {new Date(m.date).toLocaleDateString()}
              </time>
            </div>
          </li>
        ))}
        {milestones.length === 0 && (
          <li className="ml-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No milestones yet. Start your journey!
          </li>
        )}
      </ol>
    </div>
  );
}
