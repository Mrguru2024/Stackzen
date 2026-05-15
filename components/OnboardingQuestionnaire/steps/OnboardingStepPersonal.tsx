'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  OnboardingData,
  IncomeSource,
  IncomeRange,
  Lifestyle,
  TrackingMethod,
  FinancialGoal,
  FinancialMindset,
} from '@/types/onboarding';

interface OnboardingStepPersonalProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
  initialData?: Partial<OnboardingData>;
  skipsLeft: number;
}

const OnboardingStepPersonal: React.FC<OnboardingStepPersonalProps> = ({
  onNext,
  onSkip,
  initialData = {},
  skipsLeft,
}) => {
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    incomeSource: initialData.incomeSource,
    incomeRange: initialData.incomeRange,
    lifestyle: initialData.lifestyle,
    trackingMethod: initialData.trackingMethod,
    financialGoals: initialData.financialGoals || [],
    financialMindset: initialData.financialMindset,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleGoalToggle = (goal: FinancialGoal) => {
    setFormData(prev => {
      const goals = prev.financialGoals || [];
      const newGoals = goals.includes(goal)
        ? goals.filter(g => g !== goal)
        : goals.length < 3
          ? [...goals, goal]
          : goals;
      return { ...prev, financialGoals: newGoals };
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
      onSubmit={handleSubmit}
    >
      <h1 className="mb-4 text-2xl font-bold">Let&apos;s get to know you</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        We&apos;ll use this information to personalize your experience
      </p>

      {/* Income Source */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s your current source of income?
        </label>
        <select
          value={formData.incomeSource || ''}
          onChange={e => setFormData({ ...formData, incomeSource: e.target.value as IncomeSource })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your current source of income"
        >
          <option value="">Select an option</option>
          <option value="job">Job (W2)</option>
          <option value="contract">Contract/Gig (1099)</option>
          <option value="business">Business owner</option>
          <option value="student">Student</option>
          <option value="unemployed">Unemployed</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Income Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What is your average monthly income (after taxes)?
        </label>
        <select
          value={formData.incomeRange || ''}
          onChange={e => setFormData({ ...formData, incomeRange: e.target.value as IncomeRange })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your average monthly income range"
        >
          <option value="">Select an option</option>
          <option value="under_1000">Less than $1,000</option>
          <option value="1000_2999">$1,000 – $2,999</option>
          <option value="3000_4999">$3,000 – $4,999</option>
          <option value="5000_7499">$5,000 – $7,499</option>
          <option value="7500_plus">$7,500 or more</option>
          <option value="prefer_not_to_say">Prefer not to answer</option>
        </select>
      </div>

      {/* Lifestyle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          How would you describe your current lifestyle?
        </label>
        <select
          value={formData.lifestyle || ''}
          onChange={e => setFormData({ ...formData, lifestyle: e.target.value as Lifestyle })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your current lifestyle description"
        >
          <option value="">Select an option</option>
          <option value="comfortable">Comfortable – I meet my needs and have savings</option>
          <option value="stable">Stable – I meet my needs but have limited savings</option>
          <option value="struggling">Struggling – I often fall short on bills or essentials</option>
          <option value="rebuilding">
            Rebuilding – I&apos;m recovering from financial setbacks
          </option>
          <option value="growing">
            Growing – I&apos;m earning more but unsure how to manage it
          </option>
        </select>
      </div>

      {/* Tracking Method */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Do you currently track your income and expenses?
        </label>
        <select
          value={formData.trackingMethod || ''}
          onChange={e =>
            setFormData({ ...formData, trackingMethod: e.target.value as TrackingMethod })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your income and expense tracking method"
        >
          <option value="">Select an option</option>
          <option value="manual">Yes, manually</option>
          <option value="app">Yes, using an app/tool</option>
          <option value="want_to">No, but I want to</option>
          <option value="not_interested">No, and I&apos;m not interested right now</option>
        </select>
      </div>

      {/* Financial Goals */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What are your top 3 financial goals right now? (Choose up to 3)
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { value: 'build_savings', label: 'Build savings' },
            { value: 'eliminate_debt', label: 'Eliminate debt' },
            { value: 'buy_home_vehicle', label: 'Buy a home or vehicle' },
            { value: 'fund_business', label: 'Fund a business' },
            { value: 'travel_lifestyle', label: 'Travel or lifestyle upgrades' },
            { value: 'retirement', label: 'Plan for retirement' },
            { value: 'improve_credit', label: 'Improve credit' },
            { value: 'invest_wealth', label: 'Invest and grow wealth' },
            { value: 'survive', label: 'Just trying to survive' },
          ].map(goal => (
            <label
              key={goal.value}
              className="relative flex cursor-pointer items-center rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={formData.financialGoals?.includes(goal.value as FinancialGoal) || false}
                onChange={() => handleGoalToggle(goal.value as FinancialGoal)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                aria-label={`Select ${goal.label} as a financial goal`}
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{goal.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Financial Mindset */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Which of these best describes your current financial mindset?
        </label>
        <select
          value={formData.financialMindset || ''}
          onChange={e =>
            setFormData({ ...formData, financialMindset: e.target.value as FinancialMindset })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your current financial mindset"
        >
          <option value="">Select an option</option>
          <option value="cautious">I&apos;m cautious and want to feel secure</option>
          <option value="want_to_grow">I want to grow but don&apos;t know how</option>
          <option value="risk_taker">I take risks and want to scale up</option>
          <option value="overwhelmed">I feel overwhelmed and need support</option>
          <option value="disciplined">I&apos;m disciplined and need advanced strategies</option>
        </select>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onSkip}
          disabled={skipsLeft === 0}
          className={`text-sm underline transition ${
            skipsLeft === 0
              ? 'cursor-not-allowed text-gray-400'
              : 'text-gray-500 hover:text-green-600'
          }`}
        >
          Skip for now
        </button>
        <button
          type="submit"
          className="transform rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition duration-200 ease-in-out hover:scale-[1.02] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Continue
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-gray-600 dark:text-gray-400">
          I&apos;m looking to improve my financial situation
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          I&apos;m ready to take control of my finances
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          I&apos;m committed to making positive changes
        </p>
      </div>
    </motion.form>
  );
};

export default OnboardingStepPersonal;
