import React from 'react';
import IncomeHub from '@/components/IncomeHub';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function IncomePage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-2xl font-bold">Income</h1>
        <ThemeToggle />
      </div>
      <IncomeHub />
    </div>
  );
}
