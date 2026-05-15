import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function Income() {
  // Fetch income entries from the database
  const incomeEntries = await prisma.income.findMany({
    orderBy: { date: 'desc' },
    include: { user: true },
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Income</h1>
      {/* Add IncomeDialog here if you have one */}
      <div className="mt-8">
        <table className="min-w-full overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {incomeEntries.map(income => (
              <tr key={income.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{income.description}</td>
                <td className="px-4 py-2">{income.source}</td>
                <td className="px-4 py-2">${income.amount.toFixed(2)}</td>
                <td className="px-4 py-2">{new Date(income.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
