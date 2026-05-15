import React from 'react';
import { prisma } from '@/lib/prisma';

export type GuardrailsProps = Record<string, never>;

export default async function Guardrails({}: GuardrailsProps) {
  // Fetch guardrails and alerts from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { guardrails: true } });
  const guardrails = user?.guardrails ?? [];

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Spending Guardrails</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold dark:text-white">Your Limits & Alerts</h2>
        <table className="mb-4 w-full text-left">
          <thead>
            <tr>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Limit ($)</th>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Alert</th>
            </tr>
          </thead>
          <tbody>
            {guardrails.length > 0 ? (
              guardrails.map((g: any) => (
                <tr key={g.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-2 font-medium dark:text-white">{g.category}</td>
                  <td className="px-2 py-2">{g.limit?.toFixed(2) ?? '-'}</td>
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={g.alertEnabled}
                      readOnly
                      className="form-checkbox h-5 w-5 rounded text-primary focus:ring-primary"
                      aria-label={`Toggle alert for ${g.category}`}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No guardrails set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Guardrails help you stay on track by alerting you when you approach your spending limits.
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h3 className="mb-2 font-semibold dark:text-white">Summary</h3>
        <ul className="list-inside list-disc text-gray-700 dark:text-gray-300">
          {guardrails.length > 0 ? (
            guardrails.map((g: any) => (
              <li key={g.id}>
                {g.category}: Limit ${g.limit?.toFixed(2) ?? '-'}{' '}
                {g.alertEnabled ? '(Alert On)' : '(Alert Off)'}
              </li>
            ))
          ) : (
            <li>No guardrails configured.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
