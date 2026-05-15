import React from 'react';
import { prisma } from '@/lib/prisma';

export type MentorshipProps = Record<string, never>;

export default async function Mentorship({}: MentorshipProps) {
  // Fetch mentors from the database (placeholder, adjust model as needed)
  const mentors = await prisma.mentor.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Mentorship</h1>
      <div className="space-y-6">
        {mentors.map(mentor => (
          <div
            key={mentor.id}
            className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow dark:bg-gray-900 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-lg font-semibold dark:text-white">{mentor.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Expertise: {mentor.expertise}
              </div>
            </div>
            <button
              className="hover:bg-primary-dark rounded bg-primary px-4 py-2 text-white transition-colors"
              aria-label={`Request session with ${mentor.name}`}
            >
              Request Session
            </button>
          </div>
        ))}
        {mentors.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No mentors available at this time.
          </div>
        )}
      </div>
    </div>
  );
}
