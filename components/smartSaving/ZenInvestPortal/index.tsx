import React from 'react';

const mockInvestments = [
  { theme: 'Safe', balance: 1200 },
  { theme: 'Grow', balance: 800 },
  { theme: 'Zen Nest', balance: 500 },
];

export default function ZenInvestPortal() {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Zen Invest Portal</h2>
      <p className="mb-2">Visual, simple investing for your goals.</p>
      <ul>
        {mockInvestments.map((inv, i) => (
          <li key={i} className="flex justify-between">
            <span>{inv.theme}</span>
            <span>${inv.balance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
