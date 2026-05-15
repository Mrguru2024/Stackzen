'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingData, DebtType, DebtRange, SpendingChallenge } from '@/types/onboarding';

interface OnboardingStepDebtProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
  initialData?: Partial<OnboardingData>;
  skipsLeft: number;
}

const OnboardingStepDebt: React.FC<OnboardingStepDebtProps> = ({
  onNext,
  onSkip,
  initialData = {},
  skipsLeft,
}) => {
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    debtTypes: initialData.debtTypes || [],
    debtRange: initialData.debtRange,
    spendingChallenge: initialData.spendingChallenge,
    otherSpendingChallenge: initialData.otherSpendingChallenge,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleDebtTypeToggle = (type: DebtType) => {
    setFormData(prev => {
      const types = prev.debtTypes || [];
      const newTypes = types.includes(type) ? types.filter(t => t !== type) : [...types, type];
      return { ...prev, debtTypes: newTypes };
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
      onSubmit={handleSubmit}
    >
      <h1 className="mb-4 text-2xl font-bold">Let&apos;s talk about your debt</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        We&apos;ll help you create a plan to manage and reduce your debt
      </p>

      {/* Debt Types */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What types of debt do you currently have? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { value: 'credit_cards', label: 'Credit Cards' },
            { value: 'student_loans', label: 'Student Loans' },
            { value: 'personal_loans', label: 'Personal Loans' },
            { value: 'car_loan', label: 'Car Loan' },
            { value: 'medical_bills', label: 'Medical Bills' },
            { value: 'business_debt', label: 'Business Debt' },
            { value: 'none', label: 'No Debt' },
          ].map(type => (
            <label
              key={type.value}
              className="relative flex cursor-pointer items-center rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={formData.debtTypes?.includes(type.value as DebtType) || false}
                onChange={() => handleDebtTypeToggle(type.value as DebtType)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                aria-label={`Select ${type.label} as a debt type`}
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Total Debt Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What is your total debt amount?
        </label>
        <select
          value={formData.debtRange || ''}
          onChange={e => setFormData({ ...formData, debtRange: e.target.value as DebtRange })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your total debt amount range"
        >
          <option value="">Select an option</option>
          <option value="under_1000">Less than $1,000</option>
          <option value="1000_4999">$1,000 – $4,999</option>
          <option value="5000_9999">$5,000 – $9,999</option>
          <option value="10000_24999">$10,000 – $24,999</option>
          <option value="25000_plus">$25,000 or more</option>
          <option value="prefer_not_to_say">Prefer not to answer</option>
        </select>
      </div>

      {/* Spending Challenge */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s your biggest spending challenge?
        </label>
        <select
          value={formData.spendingChallenge || ''}
          onChange={e =>
            setFormData({ ...formData, spendingChallenge: e.target.value as SpendingChallenge })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your biggest spending challenge"
        >
          <option value="">Select an option</option>
          <option value="groceries">Groceries & Food</option>
          <option value="housing">Housing & Rent</option>
          <option value="subscriptions">Subscriptions & Memberships</option>
          <option value="eating_out">Eating Out & Entertainment</option>
          <option value="transportation">Transportation & Travel</option>
          <option value="online_shopping">Online Shopping</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Other Spending Challenge */}
      {formData.spendingChallenge === 'other' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Please specify your spending challenge
          </label>
          <input
            type="text"
            value={formData.otherSpendingChallenge || ''}
            onChange={e => setFormData({ ...formData, otherSpendingChallenge: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Describe your spending challenge"
            required
            aria-label="Specify your spending challenge"
          />
        </div>
      )}

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
    </motion.form>
  );
};

export default OnboardingStepDebt;
