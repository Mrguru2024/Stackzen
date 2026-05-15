'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function IncomeHubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 text-center">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
      <p className="mb-6 text-muted-foreground">
        We couldn&apos;t load this part of Income hub. Try again, or go back and refresh.
      </p>
      <Button type="button" onClick={() => reset()} variant="default">
        Try again
      </Button>
    </div>
  );
}
