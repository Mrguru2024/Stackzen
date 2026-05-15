import { Suspense } from 'react';
import CashFlowView from '@/components/cash-flow/CashFlowView';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

export const metadata = {
  title: 'Cash Flow · StackZen',
  description: 'Deterministic cash flow outlook from ledger, bills, and invoices.',
};

export default function CashFlowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading cash flow…</div>}>
      <div className="space-y-4 py-8">
        <div className="container max-w-6xl px-4 md:px-8">
          <ExecutionContinuityBoundary />
        </div>
        <div className="py-0">
          <CashFlowView />
        </div>
      </div>
    </Suspense>
  );
}
