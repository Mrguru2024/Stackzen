import React, { useState } from 'react';

export default function TriggerSaveForm() {
  const [trigger, setTrigger] = useState('Coffee');
  const [amount, setAmount] = useState(5);

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Trigger Save (Guilty Pleasure)</h2>
      <p className="mb-2">Save a fixed amount when you spend on a guilty pleasure.</p>
      <div className="flex flex-col gap-2">
        <label>
          Trigger:
          <input
            type="text"
            className="ml-2 rounded border px-2 py-1"
            value={trigger}
            onChange={e => setTrigger(e.target.value)}
          />
        </label>
        <label>
          Save Amount ($):
          <input
            type="number"
            className="ml-2 rounded border px-2 py-1"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          />
        </label>
      </div>
      <button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save Trigger
      </button>
    </div>
  );
}
