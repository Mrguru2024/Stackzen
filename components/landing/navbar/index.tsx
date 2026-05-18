'use client';

import React from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

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
    <nav className="sticky top-0 z-50 w-full max-w-[100vw] border-b border-border/80 bg-background/90 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:supports-[backdrop-filter]:bg-background/60 xs:px-4 md:px-8 md:pb-4 md:pt-4">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-3 fold:flex-row fold:items-center fold:justify-between md:flex-1 md:flex-row md:items-center md:gap-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label="StackZen home">
            <Image
              src="/Full size.svg"
              alt="StackZen"
              width={375}
              height={375}
              unoptimized
              priority
              className="h-12 w-44 object-cover object-[50%_36%] sm:h-14 sm:w-52 md:h-16 md:w-60 md:-translate-y-3.5"
            />
          </Link>
          <div className="hidden items-center gap-6 md:flex md:gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 fold:w-auto fold:flex-nowrap sm:gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="h-9 px-3 text-xs sm:px-4 sm:text-sm" asChild>
            <Link href="/login" className={cn('!text-foreground no-underline hover:!text-foreground/90')}>
              Log in
            </Link>
          </Button>
          <Button size="sm" className="h-9 px-3 text-xs sm:px-4 sm:text-sm" asChild>
            <Link
              href="/register"
              className={cn('!text-primary-foreground no-underline hover:!text-primary-foreground/90')}
            >
              Sign up
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
