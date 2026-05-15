import React, { Suspense } from 'react';
import FinancialTimelineView from '@/components/financial-events/FinancialTimelineView';

export default function FinancialTimelinePage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted-foreground">Loading timeline…</div>}
    >
      <FinancialTimelineView />
    </Suspense>
  );
}

