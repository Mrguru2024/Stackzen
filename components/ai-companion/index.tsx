'use client';

import React from 'react';

export type AICompanionProps = Record<string, never>;

/** Placeholder UI until AI interactions are persisted on a Prisma model. */
export default function AICompanion({}: AICompanionProps) {
  const interactions: { id: string; message: string }[] = [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">AI Companion</h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Chat with AI</h2>
        <div className="mb-4 h-64 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {interactions.length > 0 ? (
            interactions.map(interaction => (
              <div key={interaction.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{interaction.message}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No interactions yet.</p>
          )}
        </div>
        <button
          type="button"
          className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Talk to a Mentor
        </button>
      </div>
    </div>
  );
}
