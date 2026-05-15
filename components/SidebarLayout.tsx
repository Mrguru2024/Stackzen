'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarWrapper } from '@/components/sidebar-wrapper';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith('/auth/signin') ||
    pathname.startsWith('/auth/signup') ||
    pathname.startsWith('/auth/error');

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarWrapper>{children}</SidebarWrapper>
    </div>
  );
}
