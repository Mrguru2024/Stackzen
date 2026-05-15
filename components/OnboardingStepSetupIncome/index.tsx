'use client';

import React, { useState } from 'react';

interface IncomeSource {
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'annually';
}

interface OnboardingStepSetupIncomeProps {
  onNext: (incomeData: {
    sources: IncomeSource[];
    allocation: {
      needs: number;
      savings: number;
      investments: number;
      needsTarget: number;
      savingsTarget: number;
      investmentsTarget: number;
    };
    monthsWithIncome: number;
  }) => void;
}

const OnboardingStepSetupIncome: React.FC<OnboardingStepSetupIncomeProps> = ({ onNext }) => {
  const [sources, setSources] = useState<IncomeSource[]>([
    { name: '', amount: 0, frequency: 'monthly' },
  ]);
  const [allocation, setAllocation] = useState({
    needs: 40,
    savings: 30,
    investments: 30,
    needsTarget: 40,
    savingsTarget: 30,
    investmentsTarget: 30,
  });
  const [monthsWithIncome, setMonthsWithIncome] = useState(12);

  const _addSource = () => {
    setSources([...sources, { name: '', amount: 0, frequency: 'monthly' }]);
  };

  const _removeSource = (index: number) => {
    if (sources.length > 1) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const _updateSource = (index: number, field: keyof IncomeSource, value: string | number) => {
    const _newSources = [...sources];
    _newSources[index] = { ..._newSources[index], [field]: value };
    setSources(_newSources);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const _totalMonthlyIncome = sources.reduce((total, source) => {
    let monthlyAmount = source.amount;
    switch (source.frequency) {
      case 'weekly':
        monthlyAmount = source.amount * 4.33;
        break;
      case 'biweekly':
        monthlyAmount = source.amount * 2.17;
        break;
      case 'annually':
        monthlyAmount = source.amount / 12;
        break;
    }
    return total + monthlyAmount;
  }, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">Income Setup</h1>
      <p className="mb-6">
        Let&apos;s understand your income sources and how you&apos;d like to allocate your money
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Income Sources */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Income Sources</h2>
          {sources.map((source, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Source Name</label>
                <input
                  type="text"
                  value={source.name}
                  onChange={e => _updateSource(index, 'name', e.target.value)}
                  placeholder="e.g., Main Job, Freelance"
                  className="w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  value={source.amount}
                  onChange={e => _updateSource(index, 'amount', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  className="w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Frequency</label>
                <select
                  value={source.frequency}
                  onChange={e => _updateSource(index, 'frequency', e.target.value as any)}
                  className="w-full rounded border p-2"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => _removeSource(index)}
                  disabled={sources.length === 1}
                  className="w-full rounded border bg-gray-100 p-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={_addSource}
            className="w-full rounded border bg-gray-100 p-2 hover:bg-gray-200"
          >
            + Add Another Income Source
          </button>
        </div>

        {/* Income Stability */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Income Stability</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">
              How many months have you had consistent income?
            </label>
            <select
              value={monthsWithIncome}
              onChange={e => setMonthsWithIncome(Number(e.target.value))}
              className="w-full rounded border p-2"
            >
              <option value="1">1-3 months</option>
              <option value="6">4-6 months</option>
              <option value="12">7-12 months</option>
              <option value="24">1-2 years</option>
              <option value="60">2+ years</option>
            </select>
          </div>
        </div>

        {/* Allocation Preferences */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Income Allocation Preferences</h2>
          <p className="text-sm text-gray-600">
            How would you like to allocate your monthly income? (Total should equal 100%)
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Needs (%)</label>
              <input
                type="number"
                value={allocation.needsTarget}
                onChange={e =>
                  setAllocation({
                    ...allocation,
                    needsTarget: Number(e.target.value),
                    savingsTarget: 100 - Number(e.target.value) - allocation.investmentsTarget,
                  })
                }
                min="0"
                max="100"
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Savings (%)</label>
              <input
                type="number"
                value={allocation.savingsTarget}
                onChange={e =>
                  setAllocation({
                    ...allocation,
                    savingsTarget: Number(e.target.value),
                    investmentsTarget: 100 - allocation.needsTarget - Number(e.target.value),
                  })
                }
                min="0"
                max="100"
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Investments (%)</label>
              <input
                type="number"
                value={allocation.investmentsTarget}
                onChange={e =>
                  setAllocation({
                    ...allocation,
                    investmentsTarget: Number(e.target.value),
                    savingsTarget: 100 - allocation.needsTarget - Number(e.target.value),
                  })
                }
                min="0"
                max="100"
                className="w-full rounded border p-2"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Total:{' '}
              {allocation.needsTarget + allocation.savingsTarget + allocation.investmentsTarget}%
              {allocation.needsTarget + allocation.savingsTarget + allocation.investmentsTarget !==
                100 && <span className="ml-2 text-red-500">(Should equal 100%)</span>}
            </p>
            <p className="mt-2 text-lg font-semibold">
              Estimated Monthly Income: ${_totalMonthlyIncome.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default OnboardingStepSetupIncome;
