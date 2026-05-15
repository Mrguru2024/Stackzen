import { Suspense } from 'react';
import UnifiedOperationalWorkspace from '@/components/operational-workspace/UnifiedOperationalWorkspace';

export const metadata = {
  title: 'Operations hub · StackZen',
  description:
    'Unified operational workspace: prioritized attention, adaptive shortcuts, and real workflows across money, guidance, and work.',
};

export default function OperationalCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading operations hub…</div>}>
      <div className="container max-w-6xl py-8">
        <UnifiedOperationalWorkspace />
      </div>
    </Suspense>
  );
}
