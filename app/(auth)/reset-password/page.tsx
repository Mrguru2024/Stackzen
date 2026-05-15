import React, { Suspense } from 'react';
import ResetPasswordClient from './reset-password-client';

function ResetPasswordFallback() {
  return (
    <div className="container flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
