'use client';
import { Button } from '@/components/ui/button';

import React from 'react';
import { motion } from 'framer-motion';
import { OnboardingData } from '@/types/onboarding';

interface OnboardingStepCompleteProps {
  onFinish: () => void;
  loading: boolean;
  error: string | null;
  data: Partial<OnboardingData>;
}

const OnboardingStepComplete: React.FC<OnboardingStepCompleteProps> = ({
  onFinish,
  loading,
  error,
  data,
}) => {
  const _renderSummaryItem = (label: string, value: string | string[] | undefined) => {
    if (!value) return null;
    return (
      <div className="flex justify-between border-b border-gray-200 py-2 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {Array.isArray(value) ? value.join(', ') : value}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
        >
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h1 className="mb-4 text-2xl font-bold">You&apos;re all set!</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Let&apos;s start your financial journey
        </p>
      </div>

      {/* Summary Section */}
      <div className="space-y-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Your Preferences
        </h3>

        {/* Personal & Lifestyle */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Personal & Lifestyle
          </h4>
          {_renderSummaryItem('Income Source', data.incomeSource)}
          {_renderSummaryItem('Income Range', data.incomeRange)}
          {_renderSummaryItem('Lifestyle', data.lifestyle)}
          {_renderSummaryItem('Financial Goals', data.financialGoals)}
        </div>

        {/* Debt & Spending */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Debt & Spending</h4>
          {_renderSummaryItem('Debt Types', data.debtTypes)}
          {_renderSummaryItem('Debt Range', data.debtRange)}
          {_renderSummaryItem('Spending Challenge', data.spendingChallenge)}
        </div>

        {/* AI & Human Experience */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            AI & Human Experience
          </h4>
          {_renderSummaryItem('Guidance Tone', data.guidanceTone)}
          {_renderSummaryItem('Accountability Level', data.accountabilityLevel)}
          {_renderSummaryItem('Mentor Preference', data.mentorPreference)}
        </div>

        {/* Smart Logic Setup */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Smart Logic Setup
          </h4>
          {_renderSummaryItem('Interaction Frequency', data.interactionFrequency)}
          {_renderSummaryItem('Resource Preference', data.resourcePreference)}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-6">
        <button
          onClick={onFinish}
          disabled={loading}
          className={`w-full transform rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition duration-200 ease-in-out hover:scale-[1.02] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            loading ? 'cursor-not-allowed opacity-75' : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Setting up your experience...
            </div>
          ) : (
            'Start Your Journey'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default OnboardingStepComplete;
