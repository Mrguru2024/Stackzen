'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}

Navbar.displayName = 'Navbar';
