'use client';

import React from 'react';

import { SessionProvider } from './session-provider';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
