import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function InvestmentsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-2xl font-bold">Investments</h1>
        <ThemeToggle />
      </div>
      <p>This is the Investments page. Build your investments features here.</p>
    </div>
  );
}
