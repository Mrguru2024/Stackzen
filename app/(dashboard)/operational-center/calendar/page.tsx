import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FinancialTimingCalendar from '@/components/operational-workspace/FinancialTimingCalendar';
import { Button } from '@/components/ui/button';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

export const metadata = {
  title: 'Timing calendar · StackZen',
  description:
    'Interactive financial timing calendar: deterministic projection of recurring bills, invoices, goal targets and detected obligations with user-approved drag-and-drop shift proposals.',
};

export default function OperationalCenterCalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading timing calendar…</div>}>
      <div className="container max-w-6xl py-8">
        <ExecutionContinuityBoundary />
        <header className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
              <Link href="/operational-center">
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
                Back to operations hub
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Financial timing calendar
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Interactive projection of your recurring bills, invoice due dates, goal targets and detected obligations.
            Drag a recurring-bill chip onto another day to propose a shift — every change is user-approved through
            the operational-action approval pipeline. Read-only Google Calendar subscription available below.
          </p>
        </header>

        <FinancialTimingCalendar />
      </div>
    </Suspense>
  );
}
