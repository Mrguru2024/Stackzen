import React from 'react';
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

const _navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Icons.layoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Icons.receipt },
  { name: 'Goals', href: '/goals', icon: Icons.target },
  { name: 'Challenges', href: '/challenges', icon: Icons.trophy },
  { name: 'Settings', href: '/settings', icon: Icons.settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const _pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-200 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/Full size.svg" alt="StackZen Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold">StackZen</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <Icons.x className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 px-2 py-4">
          {_navigation.map(item => {
            const _isActive = _pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  _isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
              <Icons.logout className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-200 ease-in-out',
          isSidebarOpen ? 'lg:pl-64' : ''
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Icons.menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
