import React, { useState } from 'react';

export default function AutoSaverForm() {
  const [amount, setAmount] = useState(10);
  const [frequency, setFrequency] = useState('weekly');

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Zen Auto-Saver</h2>
      <p className="mb-2">Set up automatic recurring savings.</p>
      <div className="flex flex-col gap-2">
        <label>
          Amount ($):
          <input
            type="number"
            className="ml-2 rounded border px-2 py-1"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          />
        </label>
        <label>
          Frequency:
          <select
            className="ml-2 rounded border px-2 py-1"
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>
      <button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save Rule
      </button>
    </div>
  );
}
