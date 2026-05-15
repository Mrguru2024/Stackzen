'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EmergencyFundResults {
  targetAmount: number;
  monthsToGoal: number;
  monthlyContribution: number;
  completionDate: string;
}

const EmergencyFundCalculator: React.FC = () => {
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('');
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('');
  const [monthsOfExpenses, setMonthsOfExpenses] = useState<string>('6');
  const [results, setResults] = useState<EmergencyFundResults | null>(null);

  const calculateEmergencyFund = () => {
    const expenses = parseFloat(monthlyExpenses);
    const savings = parseFloat(currentSavings);
    const contribution = parseFloat(monthlyContribution);
    const months = parseFloat(monthsOfExpenses);

    if (isNaN(expenses) || isNaN(savings) || isNaN(contribution) || isNaN(months)) {
      return;
    }

    const targetAmount = expenses * months;
    const remainingAmount = Math.max(0, targetAmount - savings);
    const monthsToGoal = Math.ceil(remainingAmount / contribution);

    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToGoal);

    setResults({
      targetAmount,
      monthsToGoal,
      monthlyContribution: contribution,
      completionDate: completionDate.toLocaleDateString(),
    });
  };

  useEffect(() => {
    if (monthlyExpenses && currentSavings && monthlyContribution) {
      calculateEmergencyFund();
    }
  }, [monthlyExpenses, currentSavings, monthlyContribution, monthsOfExpenses]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Emergency Fund Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Calculate your emergency fund target and timeline
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Monthly Expenses */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Expenses
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              value={monthlyExpenses}
              onChange={e => setMonthlyExpenses(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.01"
              aria-label="Enter your monthly expenses"
            />
          </div>
        </div>

        {/* Current Savings */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Emergency Savings
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              value={currentSavings}
              onChange={e => setCurrentSavings(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.01"
              aria-label="Enter your current emergency savings"
            />
          </div>
        </div>

        {/* Monthly Contribution */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Contribution
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              step="0.01"
              aria-label="Enter your monthly contribution"
            />
          </div>
        </div>

        {/* Months of Expenses */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Months of Expenses
          </label>
          <select
            value={monthsOfExpenses}
            onChange={e => setMonthsOfExpenses(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Select target months of expenses"
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="9">9 months</option>
            <option value="12">12 months</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Emergency Fund Plan</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Target Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.targetAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Monthly Contribution</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.monthlyContribution.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Months to Goal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.monthsToGoal} months
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Completion Date</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.completionDate}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <h4 className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">Tips</h4>
        <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
          <li>• Aim for 3-6 months of expenses in your emergency fund</li>
          <li>• Keep your emergency fund in a high-yield savings account</li>
          <li>• Only use this fund for true emergencies</li>
          <li>• Replenish the fund after using it</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyFundCalculator;
