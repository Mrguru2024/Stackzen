'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ViewAsProvider } from './ViewAsProvider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ViewAsProvider>{children}</ViewAsProvider>
    </SessionProvider>
  );
}
