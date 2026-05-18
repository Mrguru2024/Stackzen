'use client';

import React from 'react';

import { Button } from '@/components/ui';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section
      aria-labelledby="landing-cta-heading"
      className="border-t border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8 dark:bg-muted/10"
    >
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/80 bg-card px-6 py-10 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-12 dark:ring-white/10">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.07] via-transparent to-emerald-800/[0.08] dark:from-primary/15 dark:to-emerald-950/25"
          aria-hidden
        />

        <div className="relative text-center">
          <h2
            id="landing-cta-heading"
            className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Ready to run your income like a business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            One workspace for splits, invoices, goals, and cash flow—so you spend less time in
            spreadsheets and more time earning.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-sm" asChild>
              <Link
                href="/register"
                className={cn(
                  '!text-primary-foreground no-underline hover:!text-primary-foreground/90'
                )}
              >
                Start free
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <Link
              href="#income-split"
              className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Try the 40/30/30 calculator
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card to explore. Upgrade when you&apos;re ready.
          </p>
        </div>
      </div>
    </section>
  );
}
