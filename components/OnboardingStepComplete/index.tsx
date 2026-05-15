'use client';

import React from 'react';

interface OnboardingStepCompleteProps {
  onFinish: () => void;
  loading?: boolean;
  error?: string | null;
}

const OnboardingStepComplete: React.FC<OnboardingStepCompleteProps> = ({
  onFinish,
  loading,
  error,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">Onboarding Complete!</h1>
      <p className="mb-6">Thank you for completing the onboarding process.</p>
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <button
        onClick={onFinish}
        className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Finishing...
          </span>
        ) : (
          'Finish'
        )}
      </button>
    </div>
  );
};

export default OnboardingStepComplete;
