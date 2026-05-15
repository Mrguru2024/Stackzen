'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui';
import { _logError as logError } from '@/lib/error';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    const browserWindow = globalThis.window;

    // Log the error once
    logError({
      message: error.message || 'Unknown error',
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: browserWindow ? browserWindow.location.href : 'unknown',
      userAgent: browserWindow ? browserWindow.navigator.userAgent : 'unknown',
    });
  }, [error.digest, error.message, error.stack]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Critical Error</h1>
            <p className="mb-4 text-muted-foreground">
              A critical error has occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-muted-foreground">Error ID: {error.digest}</p>
            )}
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
