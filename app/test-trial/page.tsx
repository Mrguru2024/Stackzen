import React from 'react';
import { TrialBanner } from '@/components/trial/trial-banner';

export default function TestTrialPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Trial Banner Test</h1>

        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Trial Banner Component</h2>
            <TrialBanner />
          </div>

          <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <h3 className="mb-2 font-semibold">Test Instructions:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>If you&apos;re logged in, the trial banner should appear above</li>
              <li>If not logged in, you&apos;ll see a loading state</li>
              <li>Try logging in to see the full trial banner functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
