'use client';

import React from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavLink {
  text: string;
  href: string;
}

const navLinks: NavLink[] = [
  { text: 'Features', href: '#features' },
  { text: 'Income Tools', href: '#income-split' },
  { text: 'Pricing', href: '#pricing' },
  { text: 'FAQ', href: '#faq' },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full max-w-[100vw] border-b border-gray-200/80 bg-white/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/80 xs:px-4 md:px-8 md:pb-4 md:pt-4">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-3 fold:flex-row fold:items-center fold:justify-between md:flex-1 md:flex-row md:items-center md:gap-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center self-start fold:self-center">
            <Image
              src="/Full size.svg"
              alt="StackZen Logo"
              width={220}
              height={113}
              className="h-8 w-auto max-w-[min(16rem,72vw)] object-contain sm:h-10 md:h-12 md:max-w-none"
              sizes="(max-width: 768px) 72vw, 220px"
              priority
            />
          </Link>
          <div className="hidden items-center gap-6 md:flex md:gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-[#4CAF50] dark:text-gray-200"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 fold:w-auto fold:flex-nowrap sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-md border border-[#4CAF50] px-3 py-2 text-xs font-semibold text-[#4CAF50] transition-colors hover:bg-[#4CAF50]/10 sm:px-4 sm:text-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[#4CAF50] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#43A047] sm:px-4 sm:text-sm"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
