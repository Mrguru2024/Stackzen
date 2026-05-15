'use client';

import React from 'react';

import { Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-primary to-accent py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to take control of your finances?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Join thousands of users who are already saving more and spending smarter with StackZen.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="px-8 text-lg" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white px-8 text-lg text-white hover:bg-white/10"
              asChild
            >
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-white/80">No credit card required. 14-day free trial.</p>
        </div>
      </div>
    </section>
  );
}
