'use client';

import React from 'react';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return <div className="app-shell flex min-h-dvh flex-col">{children}</div>;
}
