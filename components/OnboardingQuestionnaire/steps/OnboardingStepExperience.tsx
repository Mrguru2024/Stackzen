'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  OnboardingData,
  GuidanceTone,
  AccountabilityLevel,
  MentorPreference,
} from '@/types/onboarding';

interface OnboardingStepExperienceProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
  initialData?: Partial<OnboardingData>;
  skipsLeft: number;
}

const OnboardingStepExperience: React.FC<OnboardingStepExperienceProps> = ({
  onNext,
  onSkip,
  initialData = {},
  skipsLeft,
}) => {
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    guidanceTone: initialData.guidanceTone,
    accountabilityLevel: initialData.accountabilityLevel,
    mentorPreference: initialData.mentorPreference,
    currentStruggle: initialData.currentStruggle,
    breakthroughGoal: initialData.breakthroughGoal,
    mentorContact: initialData.mentorContact,
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
      <h1 className="mb-4 text-2xl font-bold">Tell us about your experience</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        We&apos;ll use this to personalize your financial journey
      </p>

      {/* Guidance Tone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What kind of guidance tone do you prefer?
        </label>
        <select
          value={formData.guidanceTone || ''}
          onChange={e => setFormData({ ...formData, guidanceTone: e.target.value as GuidanceTone })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your preferred guidance tone"
        >
          <option value="">Select an option</option>
          <option value="encouraging">Encouraging & Supportive</option>
          <option value="direct">Direct & Straightforward</option>
          <option value="gentle">Gentle & Patient</option>
          <option value="mixed">Mix of Different Styles</option>
        </select>
      </div>

      {/* Accountability Level */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          How much accountability do you want?
        </label>
        <select
          value={formData.accountabilityLevel || ''}
          onChange={e =>
            setFormData({
              ...formData,
              accountabilityLevel: e.target.value as AccountabilityLevel,
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your desired accountability level"
        >
          <option value="">Select an option</option>
          <option value="reminders">Just reminders</option>
          <option value="guidance_alerts">Guidance & alerts</option>
          <option value="full_partner">Full accountability partner</option>
          <option value="explore_alone">Let me explore on my own</option>
        </select>
      </div>

      {/* Mentor Preference */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Would you like to work with a human financial mentor?
        </label>
        <select
          value={formData.mentorPreference || ''}
          onChange={e =>
            setFormData({ ...formData, mentorPreference: e.target.value as MentorPreference })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          required
          aria-label="Select your preference for working with a human financial mentor"
        >
          <option value="">Select an option</option>
          <option value="yes_asap">Yes, connect me now</option>
          <option value="maybe_later">Maybe later</option>
          <option value="ai_only">No, I prefer AI guidance</option>
          <option value="already_working">I&apos;m already working with someone</option>
        </select>
      </div>

      {/* Current Struggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s your biggest financial struggle right now?
        </label>
        <textarea
          value={formData.currentStruggle || ''}
          onChange={e => setFormData({ ...formData, currentStruggle: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={3}
          placeholder="Share your current financial challenges..."
          required
          aria-label="Describe your biggest financial struggle"
        />
      </div>

      {/* Breakthrough Goal */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What would be your ideal financial breakthrough?
        </label>
        <textarea
          value={formData.breakthroughGoal || ''}
          onChange={e => setFormData({ ...formData, breakthroughGoal: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={3}
          placeholder="Describe your ideal financial breakthrough..."
          required
          aria-label="Describe your ideal financial breakthrough"
        />
      </div>

      {/* Mentor Contact (if applicable) */}
      {formData.mentorPreference === 'yes_asap' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            How would you like your mentor to contact you?
          </label>
          <input
            type="text"
            value={formData.mentorContact || ''}
            onChange={e => setFormData({ ...formData, mentorContact: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Email or phone number"
            required
            aria-label="Enter your preferred contact method for mentor communication"
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

export default OnboardingStepExperience;
