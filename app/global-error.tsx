'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui';
import { logError, toErrorLog } from '@/lib/error';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const digest = error.digest;
  const devMessage =
    process.env.NODE_ENV === 'development'
      ? error.message?.trim() || (digest ? `Error digest: ${digest}` : null)
      : null;

  useEffect(() => {
    const win = globalThis.window ?? null;
    const entry = toErrorLog(error, win);
    logError(entry, error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Critical Error</h1>
            <p className="mb-4 text-muted-foreground">
              A critical error has occurred. Please try refreshing the page.
            </p>
            {devMessage ? (
              <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
                {devMessage}
              </p>
            ) : null}
            {digest ? (
              <p className="mb-4 text-sm text-muted-foreground">Error ID: {digest}</p>
            ) : null}
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => {
                  reset();
                  globalThis.window.location.href = '/';
                }}
                className="w-full"
              >
                Return to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => globalThis.window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
