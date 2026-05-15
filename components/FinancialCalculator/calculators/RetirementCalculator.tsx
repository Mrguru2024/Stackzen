'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RetirementResults {
  monthlyContribution: number;
  totalSavings: number;
  interestEarned: number;
  yearsToRetirement: number;
}

const RetirementCalculator: React.FC = () => {
  const [currentAge, setCurrentAge] = useState<string>('');
  const [retirementAge, setRetirementAge] = useState<string>('');
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [expectedReturn, setExpectedReturn] = useState<string>('7');
  const [inflationRate, setInflationRate] = useState<string>('3');
  const [results, setResults] = useState<RetirementResults | null>(null);

  const calculateRetirement = () => {
    const age = parseInt(currentAge);
    const retireAge = parseInt(retirementAge);
    const savings = parseFloat(currentSavings);
    const income = parseFloat(monthlyIncome);
    const returnRate = parseFloat(expectedReturn) / 100;
    const inflation = parseFloat(inflationRate) / 100;

    if (
      isNaN(age) ||
      isNaN(retireAge) ||
      isNaN(savings) ||
      isNaN(income) ||
      isNaN(returnRate) ||
      isNaN(inflation)
    ) {
      return;
    }

    const yearsToRetirement = retireAge - age;
    const monthlyReturnRate = returnRate / 12;
    const _monthlyInflationRate = inflation / 12;

    // Calculate required monthly contribution
    const targetIncome = income * 0.8; // 80% of current income
    const futureValue = targetIncome * 12 * 25; // 25 years of retirement
    const presentValue = futureValue / Math.pow(1 + inflation, yearsToRetirement);

    const monthlyContribution =
      (presentValue - savings * Math.pow(1 + returnRate, yearsToRetirement)) /
      ((Math.pow(1 + monthlyReturnRate, yearsToRetirement * 12) - 1) / monthlyReturnRate);

    const totalSavings =
      savings * Math.pow(1 + returnRate, yearsToRetirement) +
      monthlyContribution *
        ((Math.pow(1 + monthlyReturnRate, yearsToRetirement * 12) - 1) / monthlyReturnRate);

    const interestEarned = totalSavings - (savings + monthlyContribution * yearsToRetirement * 12);

    setResults({
      monthlyContribution,
      totalSavings,
      interestEarned,
      yearsToRetirement,
    });
  };

  useEffect(() => {
    if (currentAge && retirementAge && currentSavings && monthlyIncome) {
      calculateRetirement();
    }
  }, [currentAge, retirementAge, currentSavings, monthlyIncome, expectedReturn, inflationRate]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Retirement Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Plan your retirement and calculate your required savings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Current Age */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Age
          </label>
          <input
            type="number"
            value={currentAge}
            onChange={e => setCurrentAge(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="18"
            max="100"
            aria-label="Enter your current age"
          />
        </div>

        {/* Retirement Age */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Retirement Age
          </label>
          <input
            type="number"
            value={retirementAge}
            onChange={e => setRetirementAge(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="45"
            max="100"
            aria-label="Enter your target retirement age"
          />
        </div>

        {/* Current Savings */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Retirement Savings
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
              step="1000"
              aria-label="Enter your current retirement savings"
            />
          </div>
        </div>

        {/* Monthly Income */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Monthly Income
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              step="100"
              aria-label="Enter your current monthly income"
            />
          </div>
        </div>

        {/* Expected Return Rate */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Expected Annual Return Rate (%)
          </label>
          <input
            type="number"
            value={expectedReturn}
            onChange={e => setExpectedReturn(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="1"
            max="15"
            step="0.1"
            aria-label="Enter expected annual return rate"
          />
        </div>

        {/* Inflation Rate */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Expected Inflation Rate (%)
          </label>
          <input
            type="number"
            value={inflationRate}
            onChange={e => setInflationRate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="0"
            max="10"
            step="0.1"
            aria-label="Enter expected inflation rate"
          />
        </div>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Retirement Plan Summary
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Years to Retirement</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.yearsToRetirement} years
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Required Monthly Contribution
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.monthlyContribution.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Total Savings at Retirement
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.totalSavings.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Interest Earned</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.interestEarned.toFixed(2)}
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
          <li>• Aim to save 15-20% of your income for retirement</li>
          <li>• Consider employer matching contributions if available</li>
          <li>• Review and adjust your plan annually</li>
          <li>• Diversify your investments to manage risk</li>
        </ul>
      </div>
    </div>
  );
};

export default RetirementCalculator;
