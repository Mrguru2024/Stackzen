import React, { useState } from 'react';

const Calculator403030: React.FC = () => {
  const [income, setIncome] = useState(5000);
  const [allocation, setAllocation] = useState({ needs: 40, wants: 30, savings: 30 });

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncome(Number(e.target.value));
  };

  const handleAllocationChange = (category: 'needs' | 'wants' | 'savings', value: number) => {
    setAllocation({ ...allocation, [category]: value });
  };

  const calculateAmount = (percentage: number) => {
    return (income * percentage) / 100;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">40/30/30 Income Split Calculator</h1>
      <div className="mb-4">
        <label htmlFor="income" className="mb-2 block">
          Monthly Income ($)
        </label>
        <input
          id="income"
          type="number"
          value={income}
          onChange={handleIncomeChange}
          className="rounded border p-2"
          min="0"
          title="Monthly Income"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="needs" className="mb-2 block">
          Needs (%)
        </label>
        <input
          id="needs"
          type="number"
          value={allocation.needs}
          onChange={e => handleAllocationChange('needs', Number(e.target.value))}
          className="rounded border p-2"
          min="0"
          max="100"
          title="Needs percentage"
        />
        <p>Amount: ${calculateAmount(allocation.needs)}</p>
      </div>
      <div className="mb-4">
        <label htmlFor="wants" className="mb-2 block">
          Wants (%)
        </label>
        <input
          id="wants"
          type="number"
          value={allocation.wants}
          onChange={e => handleAllocationChange('wants', Number(e.target.value))}
          className="rounded border p-2"
          min="0"
          max="100"
          title="Wants percentage"
        />
        <p>Amount: ${calculateAmount(allocation.wants)}</p>
      </div>
      <div className="mb-4">
        <label htmlFor="savings" className="mb-2 block">
          Savings (%)
        </label>
        <input
          id="savings"
          type="number"
          value={allocation.savings}
          onChange={e => handleAllocationChange('savings', Number(e.target.value))}
          className="rounded border p-2"
          min="0"
          max="100"
          title="Savings percentage"
        />
        <p>Amount: ${calculateAmount(allocation.savings)}</p>
      </div>
    </div>
  );
};

export default Calculator403030;
