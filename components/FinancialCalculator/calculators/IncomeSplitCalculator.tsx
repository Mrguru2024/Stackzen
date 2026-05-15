'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface IncomeSplit {
  needs: number;
  wants: number;
  savings: number;
}

const IncomeSplitCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [split, setSplit] = useState<IncomeSplit>({ needs: 50, wants: 30, savings: 20 });
  const [results, setResults] = useState<IncomeSplit>({ needs: 0, wants: 0, savings: 0 });
  const [customSplit, setCustomSplit] = useState<boolean>(false);

  useEffect(() => {
    if (monthlyIncome) {
      const income = parseFloat(monthlyIncome);
      if (!isNaN(income)) {
        setResults({
          needs: (income * split.needs) / 100,
          wants: (income * split.wants) / 100,
          savings: (income * split.savings) / 100,
        });
      }
    }
  }, [monthlyIncome, split]);

  const handleSplitChange = (category: keyof IncomeSplit, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const newSplit = { ...split, [category]: numValue };
      const total = Object.values(newSplit).reduce((sum, val) => sum + val, 0);
      if (total <= 100) {
        setSplit(newSplit);
      }
    }
  };

  const resetToDefault = () => {
    setSplit({ needs: 50, wants: 30, savings: 20 });
    setCustomSplit(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Income Split Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Calculate how to divide your income between needs, wants, and savings
        </p>
      </div>

      {/* Monthly Income Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Income
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
            placeholder="Enter your monthly income"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Split Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Income Split</h3>
          <button
            onClick={() => setCustomSplit(!customSplit)}
            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            {customSplit ? 'Use Default Split' : 'Customize Split'}
          </button>
        </div>

        {customSplit ? (
          <div className="space-y-4">
            {/* Needs */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Needs
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{split.needs}%</span>
              </div>
              <input
                type="range"
                value={split.needs}
                onChange={e => handleSplitChange('needs', e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                min="0"
                max="100"
                aria-label="Adjust percentage for needs"
              />
            </div>

            {/* Wants */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wants
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{split.wants}%</span>
              </div>
              <input
                type="range"
                value={split.wants}
                onChange={e => handleSplitChange('wants', e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                min="0"
                max="100"
                aria-label="Adjust percentage for wants"
              />
            </div>

            {/* Savings */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Savings
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{split.savings}%</span>
              </div>
              <input
                type="range"
                value={split.savings}
                onChange={e => handleSplitChange('savings', e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                min="0"
                max="100"
                aria-label="Adjust percentage for savings"
              />
            </div>

            <button
              onClick={resetToDefault}
              className="w-full text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Reset to Default (50/30/20)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">50%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Needs</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">30%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Wants</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">20%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Savings</div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {monthlyIncome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Monthly Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Needs</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${results.needs.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Wants</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${results.wants.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Savings</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${results.savings.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <h4 className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">Tips</h4>
        <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
          <li>• Needs: Essential expenses like rent, utilities, and groceries</li>
          <li>• Wants: Non-essential expenses like entertainment and dining out</li>
          <li>• Savings: Emergency fund, retirement, and other financial goals</li>
        </ul>
      </div>
    </div>
  );
};

export default IncomeSplitCalculator;
