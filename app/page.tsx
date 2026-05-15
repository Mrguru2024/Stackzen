'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import FinancialCalculator from '@/components/FinancialCalculator';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!hasMounted) return;
    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = ['hero', 'features', 'income-split', 'testimonials', 'pricing', 'faq'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMounted]);

  if (!hasMounted) {
    // Render nothing until mounted (avoids SSR/client mismatch)
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-blue-500 text-white">
        <h1 className="mb-4 animate-pulse bg-gradient-to-r from-white to-gray-200 bg-clip-text text-4xl font-bold text-transparent">
          StackZen
        </h1>
        <p className="mb-8 text-xl">Your personal finance dashboard</p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-background/20">
          <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-background" />
        </div>
        <p className="mt-4 text-sm opacity-70">Loading your financial dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Add padding to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row md:px-16">
          <div className="flex w-full max-w-xl flex-col items-center space-y-6 md:items-start">
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              Take Control of Your Income with the&nbsp;
              <span className="text-green-600">40/30/30 Split</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-gray-400">
              The smart financial platform built for service providers and gig workers to track
              income, maximize earnings, and build wealth through the proven 40/30/30 method.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/register"
                className="rounded bg-green-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-green-700"
              >
                Start For Free
              </a>
              <a
                href="#demo"
                className="rounded border border-green-600 px-6 py-3 font-semibold text-green-700 shadow transition hover:bg-green-50"
              >
                Watch Demo
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <svg
                  className="mr-1 h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                40/30/30 Method
              </span>
              <span className="flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                Gig Income Tools
              </span>
              <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <svg
                  className="mr-1 h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Bank Connection
              </span>
              <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <svg
                  className="mr-1 h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No Credit Card
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
              <div className="mb-4 rounded-t-xl bg-green-600 px-4 py-2 font-semibold text-white">
                StackZen Dashboard
              </div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-muted"></div>
                <div className="h-4 w-1/2 rounded bg-muted"></div>
                <div className="h-4 w-2/3 rounded bg-muted"></div>
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
            <div className="flex flex-col items-start rounded-xl bg-card p-6 shadow">
              <div className="mb-4 text-green-600">
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
            <div className="flex flex-col items-start rounded-xl bg-card p-6 shadow">
              <div className="mb-4 text-green-600">
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
            <div className="flex flex-col items-start rounded-xl bg-card p-6 shadow">
              <div className="mb-4 text-green-600">
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
            <div className="flex flex-col items-start rounded-xl bg-card p-6 shadow">
              <div className="mb-4 text-green-600">
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
            <div className="flex flex-col items-center rounded-xl bg-background p-6 shadow">
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
              <span className="font-semibold text-green-700">— Alex, Freelancer</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-background p-6 shadow">
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
              <span className="font-semibold text-green-700">— Jamie, Consultant</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-background p-6 shadow">
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
              <span className="font-semibold text-green-700">— Chris, Small Business Owner</span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-16 md:px-16">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Choose the plan that&apos;s right for you
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
            Get started for free, then upgrade to a plan that fits your needs.
          </p>
          <PricingSection />
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-card px-6 py-16 md:px-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
              Find answers to common questions about StackZen and our financial tools.
            </p>
            <div className="space-y-6">
              {/* Question 1 */}
              <div className="rounded-xl bg-background p-6 shadow-sm">
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
              <div className="rounded-xl bg-background p-6 shadow-sm">
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
              <div className="rounded-xl bg-background p-6 shadow-sm">
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
              <div className="rounded-xl bg-background p-6 shadow-sm">
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
              <div className="rounded-xl bg-background p-6 shadow-sm">
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
              <div className="rounded-xl bg-background p-6 shadow-sm">
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

        {/* Call to Action Section */}
        <section className="bg-green-600 px-6 py-16 md:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to take control of your income?
            </h2>
            <p className="mb-8 text-lg text-green-100">
              Join StackZen today and start building your financial future with confidence.
            </p>
            <a
              href="/register"
              className="rounded bg-background px-8 py-4 text-lg font-bold text-green-700 shadow transition hover:bg-green-50"
            >
              Get Started For Free
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 px-6 py-12 text-white md:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-lg font-semibold">StackZen</h3>
                <p className="text-gray-400">
                  Your personal finance dashboard for tracking income, managing expenses, and
                  building wealth.
                </p>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#features" className="text-gray-400 transition hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-gray-400 transition hover:text-white">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-gray-400 transition hover:text-white">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 transition hover:text-white">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>&copy; 2024 StackZen. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
