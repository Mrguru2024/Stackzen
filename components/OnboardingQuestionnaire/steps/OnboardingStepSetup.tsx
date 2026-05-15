'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { OnboardingData, InteractionFrequency, ResourcePreference } from '@/types/onboarding';

interface OnboardingStepSetupProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
  initialData?: Partial<OnboardingData>;
  skipsLeft: number;
}

const OnboardingStepSetup: React.FC<OnboardingStepSetupProps> = ({
  onNext,
  onSkip,
  initialData = {},
  skipsLeft,
}) => {
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    interactionFrequency: initialData.interactionFrequency,
    resourcePreference: initialData.resourcePreference,
    personalPartnerFeedback: initialData.personalPartnerFeedback,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Logic Setup</h2>

      {/* Interaction Frequency */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          How often would you like to interact with StackZen?
        </label>
        <select
          value={formData.interactionFrequency || ''}
          onChange={e =>
            setFormData({
              ...formData,
              interactionFrequency: e.target.value as InteractionFrequency,
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your preferred interaction frequency"
        >
          <option value="">Select an option</option>
          <option value="daily">Daily check-ins</option>
          <option value="weekly">Weekly updates</option>
          <option value="biweekly">Every two weeks</option>
          <option value="on_login">Only when I log in</option>
          <option value="goal_based">Based on my goals</option>
        </select>
      </div>

      {/* Resource Preference */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What kind of resources would you like to receive?
        </label>
        <select
          value={formData.resourcePreference || ''}
          onChange={e =>
            setFormData({
              ...formData,
              resourcePreference: e.target.value as ResourcePreference,
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your preferred resource type"
        >
          <option value="">Select an option</option>
          <option value="yes">All resources (educational, tools, community)</option>
          <option value="no">Just essential tools and features</option>
          <option value="verified_only">Only verified financial resources</option>
        </select>
      </div>

      {/* Personal Partner Feedback */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Any specific feedback for your AI financial partner?
        </label>
        <textarea
          value={formData.personalPartnerFeedback || ''}
          onChange={e => setFormData({ ...formData, personalPartnerFeedback: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={3}
          placeholder="Share any specific preferences or requirements..."
          aria-label="Provide feedback for your AI financial partner"
        />
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
    </motion.form>
  );
};

export default OnboardingStepSetup;
