'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  explainOperationalExecutionHandoff,
  parseOperationalHandoffFromSearchParams,
} from '@/lib/operational-execution-context';

function ExecutionContinuityBannerInner() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const explain = useMemo(() => {
    const parsed = parseOperationalHandoffFromSearchParams(searchParams);
    if (!parsed) return null;
    return explainOperationalExecutionHandoff(parsed);
  }, [searchParams]);

  if (dismissed || !explain) return null;

  return (
    <Alert className="relative border-primary/30 bg-primary/5 pr-12">
      <Info className="h-4 w-4 text-primary" aria-hidden />
      <AlertTitle>{explain.title}</AlertTitle>
      <AlertDescription className="space-y-1.5">
        {explain.bodyLines.map((line, i) => (
          <p key={i} className="text-sm leading-snug text-foreground/90">
            {line}
          </p>
        ))}
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss operational continuation notice"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </Alert>
  );
}

/**
 * Wraps the continuity banner in `<Suspense>` for `useSearchParams` (Next.js App Router).
 */
export function ExecutionContinuityBoundary() {
  return (
    <Suspense fallback={null}>
      <ExecutionContinuityBannerInner />
    </Suspense>
  );
}

export default ExecutionContinuityBoundary;
