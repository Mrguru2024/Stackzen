import React from 'react';
import { prisma } from '@/lib/prisma';

export type FinancialMentorshipProps = Record<string, never>;

export default async function FinancialMentorship({}: FinancialMentorshipProps) {
  // Fetch user's mentorship data from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { mentor: true } });
  const mentor = user?.mentor;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Mentorship</h1>
      {mentor ? (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">Your Mentor</h2>
          <div className="mb-4 flex items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {mentor.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium dark:text-white">{mentor.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mentor.email}</p>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold dark:text-white">Schedule a Session</h3>
            <button className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary">
              Book Now
            </button>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold dark:text-white">Chat with Your Mentor</h3>
            <div className="h-64 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Chat interface will be implemented here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">No Mentor Assigned</h2>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            You don&apos;t have a mentor assigned yet. Please contact support to get started.
          </p>
          <button className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary">
            Contact Support
          </button>
        </div>
      )}
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Let&apos;s work together to achieve your financial goals
      </p>
    </div>
  );
}
