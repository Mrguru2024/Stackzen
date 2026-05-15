'use client';
import { Button } from '@/components/ui/button';

import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingStepWelcomeProps {
  onNext: (data: any) => void;
}

const OnboardingStepWelcome: React.FC<OnboardingStepWelcomeProps> = ({ onNext }) => {
  return (
    <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Welcome to StackZen</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Let&apos;s get started by setting up your financial profile
          </p>
        </div>

        {/* Privacy Disclaimer */}
        <div className="space-y-4 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                🔐 Your Data, Your Power
              </h3>
              <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                At StackZen, your privacy is our priority. All information you provide is encrypted,
                stored securely, and only used to personalize your experience and connect you with
                trusted financial mentors. We never sell your data, and you maintain full control
                over what you share. Your transparency helps us serve you better—authentically and
                intentionally.
              </p>
            </div>
          </div>
        </div>

        {/* What to Expect */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What to Expect</h2>
          <ul className="space-y-3">
            {[
              'Personal & lifestyle insights',
              'Debt & spending transparency',
              'AI & human experience preferences',
              'Smart logic setup for your journey',
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300"
              >
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        <div className="pt-6">
          <button
            onClick={() => onNext({})}
            className="w-full transform rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition duration-200 ease-in-out hover:scale-[1.02] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Begin Your Journey
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingStepWelcome;
