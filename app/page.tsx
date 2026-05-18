'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import FinancialCalculator from '@/components/FinancialCalculator';
import { Button } from '@/components/ui';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasMounted]);

  if (!hasMounted) {
    // Render nothing until mounted (avoids SSR/client mismatch)
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-emerald-800 text-primary-foreground dark:to-emerald-950">
        <h1 className="mb-4 animate-pulse bg-gradient-to-r from-primary-foreground to-primary-foreground/70 bg-clip-text text-4xl font-bold text-transparent">
          StackZen
        </h1>
        <p className="mb-8 text-xl text-primary-foreground/90">Your personal finance command center</p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary-foreground" />
        </div>
        <p className="mt-4 text-sm text-primary-foreground/70">Preparing your workspace…</p>
      </div>
    );
  }

  return (
    <>
      {/* Add padding to account for fixed header */}
      <div className="bg-background pt-16">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-between gap-12 overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background px-6 py-16 md:flex-row md:px-16">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
          <div className="relative flex w-full max-w-xl flex-col items-center space-y-6 md:items-start">
            <p className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
              Built for freelancers & service businesses
            </p>
            <h1 className="text-center text-4xl font-extrabold leading-tight text-foreground md:text-left md:text-5xl">
              Take control of your income with the{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent dark:to-emerald-400">
                40/30/30 split
              </span>
            </h1>
            <p className="text-center text-lg text-muted-foreground md:text-left">
              One calm place to route every dollar—needs, growth, and taxes—so you stop guessing
              and start planning with confidence.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Button size="lg" className="w-full shadow-md shadow-primary/15 sm:w-auto" asChild>
                <Link
                  href="/register"
                  className="!text-primary-foreground no-underline hover:!text-primary-foreground/90"
                >
                  Start free
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary/30 sm:w-auto"
                asChild
              >
                <Link
                  href="#income-split"
                  className="!text-foreground no-underline hover:!text-foreground/90"
                >
                  Try the calculator
                </Link>
              </Button>
            </div>
            <p className="max-w-md text-center text-sm text-muted-foreground md:text-left">
              Connect accounts, automate envelopes, and see cash flow before it becomes a problem—
              without another spreadsheet.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm">
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                40/30/30 method
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm">
                Gig & W-2 friendly
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm">
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                Bank-grade sync
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm">
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                No card to explore
              </span>
            </div>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
              <div className="mb-4 flex items-center justify-between rounded-t-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                <span>StackZen dashboard</span>
                <span className="h-8 w-8 rounded-full bg-primary-foreground/20" aria-hidden />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded-md bg-muted" />
                <div className="h-4 w-1/2 rounded-md bg-muted" />
                <div className="h-4 w-2/3 rounded-md bg-muted" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-background px-6 py-16 md:px-16">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Everything you need to manage your finances
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
            Our comprehensive suite of tools helps you take control of your financial future with
            confidence.
          </p>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-start rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 text-primary">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 8h8m-8 0H4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Smart Budgeting</h3>
              <p className="text-sm text-muted-foreground">
                Create personalized budgets that adapt to your spending patterns and financial
                goals.
              </p>
            </div>
            <div className="flex flex-col items-start rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 text-primary">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Expense Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Get detailed insights into your spending habits with beautiful visualizations and
                reports.
              </p>
            </div>
            <div className="flex flex-col items-start rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 text-primary">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 9V7a5 5 0 00-10 0v2a5 5 0 0010 0zm-5 8v2m0-2a5 5 0 01-5-5V7a5 5 0 0110 0v5a5 5 0 01-5 5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Automated Savings</h3>
              <p className="text-sm text-muted-foreground">
                Set up smart rules to automatically save money based on your income and spending
                patterns.
              </p>
            </div>
            <div className="flex flex-col items-start rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 text-primary">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Goal Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Set financial goals and track your progress with interactive milestones and
                celebrations.
              </p>
            </div>
          </div>
        </section>

        {/* Financial Calculator Section */}
        <section id="income-split" className="px-6 py-16 md:px-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-bold md:text-3xl">The 40/30/30 Split Explained</h2>
              <p className="mb-6 text-muted-foreground">
                Our platform is built around the proven 40/30/30 income allocation method, designed
                to help you build long-term wealth while managing your day-to-day expenses.
              </p>
            </div>
            <div>
              <FinancialCalculator />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-background px-6 py-16 md:px-16">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Loved by freelancers & gig workers
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
            Don&apos;t just take our word for it - see what our users have to say about their
            experience with StackZen.
          </p>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="mb-4">
                <Image
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User"
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              </div>
              <p className="mb-2 text-center text-foreground">
                &quot;StackZen helped me finally get a handle on my freelance income. The 40/30/30
                split is genius!&quot;
              </p>
              <span className="font-semibold text-primary">— Alex, Freelancer</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="mb-4">
                <Image
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="User"
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              </div>
              <p className="mb-2 text-center text-foreground">
                &quot;The automated savings and goal tracking features make it so easy to stay
                motivated.&quot;
              </p>
              <span className="font-semibold text-primary">— Jamie, Consultant</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="mb-4">
                <Image
                  src="https://randomuser.me/api/portraits/men/65.jpg"
                  alt="User"
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              </div>
              <p className="mb-2 text-center text-foreground">
                &quot;I love the clean dashboard and how easy it is to connect my accounts.&quot;
              </p>
              <span className="font-semibold text-primary">— Chris, Small Business Owner</span>
            </div>
          </div>
        </section>

        <PricingSection />

        {/* FAQ Section */}
        <section id="faq" className="border-t border-border bg-muted/20 px-6 py-16 md:px-16 dark:bg-muted/10">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
              Find answers to common questions about StackZen and our financial tools.
            </p>
            <div className="space-y-6">
              {/* Question 1 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  What is the 40/30/30 income split method?
                </h3>
                <p className="text-muted-foreground">
                  The 40/30/30 method is a proven income management strategy where you allocate 40%
                  of your income to needs (essential expenses), 30% to wants (discretionary
                  spending), and 30% to savings and investments. This balanced approach helps you
                  maintain financial stability while building wealth.
                </p>
              </div>

              {/* Question 2 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  How secure is my financial data?
                </h3>
                <p className="text-muted-foreground">
                  We take security seriously. All data is encrypted using bank-level security
                  protocols, and we use read-only connections to your financial accounts. We never
                  store your banking credentials, and all connections are secured with 256-bit SSL
                  encryption.
                </p>
              </div>

              {/* Question 3 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Can I use StackZen with multiple income sources?
                </h3>
                <p className="text-muted-foreground">
                  Yes! StackZen is designed for people with multiple income streams. You can connect
                  various income sources, including regular employment, freelance work, gig economy
                  earnings, and investments. Our tools help you track and manage all your income in
                  one place.
                </p>
              </div>

              {/* Question 4 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  What financial calculators are available?
                </h3>
                <p className="text-muted-foreground">
                  We offer a comprehensive suite of financial calculators including: • Income Split
                  Calculator for budgeting • Retirement Calculator for long-term planning • Debt
                  Payoff Calculator for managing loans • Emergency Fund Calculator for financial
                  safety All calculators are free to use and provide detailed insights and
                  recommendations.
                </p>
              </div>

              {/* Question 5 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Is there a mobile app available?
                </h3>
                <p className="text-muted-foreground">
                  Yes! StackZen is fully responsive and works seamlessly on all devices. You can
                  access your dashboard, track expenses, and use all our tools from your smartphone,
                  tablet, or computer. We&apos;re also developing native mobile apps for iOS and
                  Android.
                </p>
              </div>

              {/* Question 6 */}
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-sm dark:bg-background/60">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  What&apos;s included in the free plan?
                </h3>
                <p className="text-muted-foreground">
                  Our free plan includes basic income tracking, the 40/30/30 calculator, one
                  financial goal tracker, and access to all our financial calculators. You can
                  upgrade to Pro or Business plans for additional features like unlimited goals,
                  advanced analytics, and team collaboration.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTASection />

        <Footer />
      </div>
    </>
  );
}
