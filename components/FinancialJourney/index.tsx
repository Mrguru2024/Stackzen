'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
// Temporary mock for useFinancialJourney if not imported
const useFinancialJourney = () => ({
  data: {
    milestones: [
      {
        id: 1,
        name: 'Getting Started',
        criteria: 'Open a savings account',
        completed: true,
        tip: 'Start with a dedicated savings account for your emergency fund.',
      },
      {
        id: 2,
        name: 'Building Foundation',
        criteria: 'Save $1,000',
        completed: false,
        tip: 'Automate a small transfer each payday to build the habit.',
      },
    ],
  },
  loading: false,
  error: null,
  updateMilestone: () => {},
});

interface FinancialJourneyProps {
  userId: string;
}

export default function FinancialJourney({ userId: _userId }: FinancialJourneyProps) {
  const { data, loading, error, updateMilestone } = useFinancialJourney();
  const [selectedMilestone, setSelectedMilestone] = useState<(typeof data.milestones)[0] | null>(
    null
  );

  const _getPersonalizedRecommendation = (milestone: (typeof data.milestones)[0]) => {
    switch (milestone.id) {
      case 1:
        return 'Continue tracking all income sources to maintain a clear picture of your cash flow and spot opportunities to increase earnings.';
      case 2:
        return "Aim to consistently save at least 10% of your income until you've reached your emergency fund goal of 3-6 months of expenses.";
      case 3:
        return 'Focus on paying off your highest interest debts first while maintaining minimum payments on others to avoid fees and credit score damage.';
      case 4:
        return 'Gradually increase your retirement contributions with each raise or income boost until you reach the maximum annual limit.';
      case 5:
        return 'Diversify your investments across multiple asset classes to balance growth potential with appropriate risk for your age and goals.';
      case 6:
        return 'Continue optimizing both your income and expenses while maintaining a sustainable investment strategy for long-term growth.';
      default:
        return 'Set specific financial goals and track your progress regularly to stay motivated on your journey to financial independence.';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Error loading financial journey data. Please try again later.
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Your Financial Journey
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your progress and get personalized recommendations for your financial goals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Milestones Section */}
        <div className="space-y-4">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Financial Milestones
          </h2>
          {data.milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg border p-4 ${
                selectedMilestone?.id === milestone.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } cursor-pointer transition-colors hover:border-blue-500`}
              onClick={() => setSelectedMilestone(milestone)}
            >
              <div className="flex items-start gap-3">
                {milestone.completed ? (
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 flex-shrink-0 text-gray-400" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{milestone.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {milestone.criteria}
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${milestone.completed ? 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Details Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          {selectedMilestone ? (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                {selectedMilestone.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Criteria</h4>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedMilestone.criteria}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pro Tip</h4>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedMilestone.tip}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Recommendation
                  </h4>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {_getPersonalizedRecommendation(selectedMilestone)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Select a milestone to view details and recommendations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
