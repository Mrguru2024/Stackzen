import React from 'react';

export default function WeeklyZenSummary() {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Weekly Zen Summary</h2>
      <p className="mb-2">Your weekly wins and progress!</p>
      <ul className="list-disc pl-5">
        <li>Saved $45 this week</li>
        <li>3/3 goals on track</li>
        <li>2 new habits started</li>
      </ul>
    </div>
  );
}
