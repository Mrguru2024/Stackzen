'use client';

import React from 'react';

interface OnboardingStepWelcomeProps {
  onNext: () => void;
}

export const OnboardingStepWelcome: React.FC<OnboardingStepWelcomeProps> = ({ onNext }) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-4xl font-bold">Welcome to StackZen</h1>
      <p className="mb-8 text-lg text-gray-600">
        Let&apos;s get started with setting up your financial journey
      </p>
      <button
        onClick={onNext}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>
  );
};
