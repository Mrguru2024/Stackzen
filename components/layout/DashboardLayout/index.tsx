'use client';

import React from 'react';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-card p-4 transition-all duration-200 flex flex-col',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mb-4 rounded bg-gray-200 p-2"
        >
          {sidebarCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {/* Main content */}
      <div className="flex min-h-screen w-full flex-1 flex-col">
        <main className="w-full flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
