'use client';

import React from 'react';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTest() {
  const [error, setError] = useState<string | null>(null);

  const testError = () => {
    try {
      throw new Error('This is a test error from SentryTest component');
    } catch (e) {
      Sentry.captureException(e);
      setError('Error captured by Sentry! Check your Sentry dashboard.');
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Sentry Test Component</h2>
      <div className="space-x-4">
        <button
          onClick={testError}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Test Error Reporting
        </button>
      </div>
      {error && (
        <div className="mt-4 rounded border border-yellow-400 bg-yellow-100 p-4">{error}</div>
      )}
    </div>
  );
}
