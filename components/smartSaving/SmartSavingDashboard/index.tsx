import React from 'react';

export default function SmartSavingDashboard() {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Smart Saving Dashboard</h2>
      <p className="mb-2">Track your goals, rules, and progress here.</p>
      <ul className="list-disc pl-5">
        <li>Round-Up Rule</li>
        <li>Auto-Saver</li>
        <li>Budget Saver</li>
        <li>Trigger Save</li>
        <li>Income Splitter</li>
      </ul>
    </div>
  );
}
