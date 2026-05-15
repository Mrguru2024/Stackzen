'use client';

import React from 'react';

interface OnboardingStepConnectBankProps {
  onNext: () => void;
}

const OnboardingStepConnectBank: React.FC<OnboardingStepConnectBankProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">Connect Your Bank Account</h1>
      <p className="mb-6">
        Securely link your bank to automatically track your income and expenses.
      </p>
      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Connect Bank
      </button>
      <p className="mt-4 text-xs text-gray-500">(Demo: This just simulates a connection.)</p>
    </div>
  );
};

export default OnboardingStepConnectBank;
