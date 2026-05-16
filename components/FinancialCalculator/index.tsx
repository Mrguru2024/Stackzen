'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RetirementCalculator from './calculators/RetirementCalculator';
import IncomeSplitCalculator from './calculators/IncomeSplitCalculator';
import DebtPayoffCalculator from './calculators/DebtPayoffCalculator';
import EmergencyFundCalculator from './calculators/EmergencyFundCalculator';

type CalculatorTab = 'retirement' | 'income-split' | 'debt-payoff' | 'emergency-fund';

const tabs: { id: CalculatorTab; label: string }[] = [
  { id: 'retirement', label: 'Retirement' },
  { id: 'income-split', label: 'Income Split' },
  { id: 'debt-payoff', label: 'Debt Payoff' },
  { id: 'emergency-fund', label: 'Emergency Fund' },
];

const FinancialCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('retirement');

  const _renderCalculator = () => {
    switch (activeTab) {
      case 'retirement':
        return <RetirementCalculator />;
      case 'income-split':
        return <IncomeSplitCalculator />;
      case 'debt-payoff':
        return <DebtPayoffCalculator />;
      case 'emergency-fund':
        return <EmergencyFundCalculator />;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Calculator Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {_renderCalculator()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FinancialCalculator;
