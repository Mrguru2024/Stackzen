'use client';

import React, { useState } from 'react';

const IncomeHub = () => {
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (description && amount && date) {
      const newEntry = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        date,
        source,
        timestamp: new Date().toISOString(),
      };
      setIncomeEntries([...incomeEntries, newEntry]);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setSource('');
    }
  };

  return (
    <div className="income-hub">
      <h2 className="text-xl font-semibold">Income Hub</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded border p-2"
            required
            title="Description"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded border p-2"
            min="0.01"
            step="0.01"
            required
            title="Amount"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded border p-2"
            required
            title="Date"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Source (e.g., Client, Gig, Job)</label>
          <input
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full rounded border p-2"
            title="Source"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Income
        </button>
      </form>
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Income Entries</h3>
        {incomeEntries.length === 0 ? (
          <p>No income entries yet. Add your first income entry above.</p>
        ) : (
          <ul className="mt-2">
            {incomeEntries.map(entry => (
              <li key={entry.id} className="mb-2 rounded border p-2">
                <strong>{entry.description}</strong> - ${entry.amount.toFixed(2)} on {entry.date}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IncomeHub;
