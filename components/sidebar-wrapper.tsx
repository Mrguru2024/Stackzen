'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const isHomePage = usePathname() === '/';

  return (
    <div
      className={cn(
        'flex w-full min-w-0 max-w-[100vw] flex-col overflow-x-hidden',
        !isHomePage && 'app-shell min-h-dvh'
      )}
    >
      {children}
    </div>
  );
}
