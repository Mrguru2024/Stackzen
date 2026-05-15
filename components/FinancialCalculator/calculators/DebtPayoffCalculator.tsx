'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Debt {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

interface DebtPayoffResults {
  totalDebt: number;
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: string;
  recommendedPayment: number;
}

const DebtPayoffCalculator: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([
    { name: '', balance: 0, interestRate: 0, minimumPayment: 0 },
  ]);
  const [monthlyPayment, setMonthlyPayment] = useState<string>('');
  const [results, setResults] = useState<DebtPayoffResults | null>(null);

  const addDebt = () => {
    setDebts([...debts, { name: '', balance: 0, interestRate: 0, minimumPayment: 0 }]);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (index: number, field: keyof Debt, value: string) => {
    const newDebts = [...debts];
    newDebts[index] = {
      ...newDebts[index],
      [field]: field === 'name' ? value : parseFloat(value) || 0,
    };
    setDebts(newDebts);
  };

  const calculateDebtPayoff = () => {
    const payment = parseFloat(monthlyPayment);
    if (isNaN(payment) || payment <= 0) return;

    let remainingDebts = [...debts];
    let totalInterest = 0;
    let months = 0;
    const currentDate = new Date();

    while (remainingDebts.length > 0) {
      // Sort debts by interest rate (highest first)
      remainingDebts.sort((a, b) => b.interestRate - a.interestRate);

      // Calculate interest for each debt
      remainingDebts = remainingDebts.map(debt => {
        const monthlyInterest = debt.balance * (debt.interestRate / 100 / 12);
        totalInterest += monthlyInterest;
        return {
          ...debt,
          balance: debt.balance + monthlyInterest,
        };
      });

      // Apply payment to highest interest debt
      const highestInterestDebt = remainingDebts[0];
      const paymentToDebt = Math.min(
        payment,
        highestInterestDebt.balance + highestInterestDebt.minimumPayment
      );

      highestInterestDebt.balance -= paymentToDebt;

      // Remove paid off debts
      remainingDebts = remainingDebts.filter(debt => debt.balance > 0);

      months++;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const recommendedPayment = Math.ceil((totalDebt + totalInterest) / months);

    setResults({
      totalDebt,
      totalInterest,
      monthsToPayoff: months,
      payoffDate: currentDate.toLocaleDateString(),
      recommendedPayment,
    });
  };

  useEffect(() => {
    if (monthlyPayment && debts.every(debt => debt.balance > 0)) {
      calculateDebtPayoff();
    }
  }, [monthlyPayment, debts, calculateDebtPayoff]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Debt Payoff Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Calculate your debt payoff strategy and timeline
        </p>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        {debts.map((debt, index) => (
          <div key={index} className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Debt {index + 1}
              </h3>
              {debts.length > 1 && (
                <button
                  onClick={() => removeDebt(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Remove debt"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Debt Name
                </label>
                <input
                  type="text"
                  value={debt.name}
                  onChange={e => updateDebt(index, 'name', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Credit Card, Student Loan"
                  aria-label="Enter debt name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Balance
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={debt.balance || ''}
                    onChange={e => updateDebt(index, 'balance', e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="0.01"
                    aria-label="Enter current balance"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={debt.interestRate || ''}
                  onChange={e => updateDebt(index, 'interestRate', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="100"
                  step="0.01"
                  aria-label="Enter interest rate"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Payment
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={debt.minimumPayment || ''}
                    onChange={e => updateDebt(index, 'minimumPayment', e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="0.01"
                    aria-label="Enter minimum payment"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addDebt}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Add Another Debt
        </button>
      </div>

      {/* Monthly Payment */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Payment Amount
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
            $
          </span>
          <input
            type="number"
            value={monthlyPayment}
            onChange={e => setMonthlyPayment(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="0"
            step="0.01"
            aria-label="Enter monthly payment amount"
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payoff Summary</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Debt</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.totalDebt.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Interest</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${results.totalInterest.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Months to Payoff</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.monthsToPayoff} months
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Payoff Date</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.payoffDate}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Recommended Monthly Payment</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ${results.recommendedPayment.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <h4 className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">Tips</h4>
        <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
          <li>• Focus on paying off high-interest debt first</li>
          <li>• Consider debt consolidation for lower interest rates</li>
          <li>• Set up automatic payments to avoid late fees</li>
          <li>• Create an emergency fund to prevent new debt</li>
        </ul>
      </div>
    </div>
  );
};

export default DebtPayoffCalculator;
