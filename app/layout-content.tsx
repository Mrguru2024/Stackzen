'use client';

import React from 'react';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { SidebarWrapper } from '@/components/sidebar-wrapper';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <>
      {isHomePage && <Navbar />}
      <SidebarWrapper>{children}</SidebarWrapper>
    </>
  );
}
