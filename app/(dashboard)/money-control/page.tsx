import { Suspense } from 'react';
import MoneyControlCenter from '@/components/money-control';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

export const metadata = {
  title: 'Money Control · StackZen',
  description: 'Review transactions, control automation rules, and resolve alerts',
};

export default function MoneyControlPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading money control...</div>}>
      <div className="px-4 pt-4 md:px-8">
        <ExecutionContinuityBoundary />
      </div>
      <MoneyControlCenter />
    </Suspense>
  );
}
