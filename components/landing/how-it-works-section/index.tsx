import React from 'react';
import Image from 'next/image';

import { CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description:
      'Sign up in minutes with our secure authentication process. No credit card required to start.',
  },
  {
    number: '02',
    title: 'Connect Your Accounts',
    description:
      'Securely link your bank accounts and credit cards to get a complete view of your finances.',
  },
  {
    number: '03',
    title: 'Set Your Goals',
    description:
      'Define your financial goals and let our AI help you create a personalized plan to achieve them.',
  },
  {
    number: '04',
    title: 'Track & Optimize',
    description:
      'Monitor your progress with real-time insights and get smart recommendations to improve.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How StackZen Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Getting started with StackZen is simple. Follow these four easy steps to begin your
            journey to financial wellness.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-full top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-border lg:block" />
                )}

                <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits list */}
        <div className="mt-20 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-8 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-6 text-2xl font-bold">Why Choose StackZen?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div className="ml-3">
                    <p className="font-medium">Bank-Level Security</p>
                    <p className="text-muted-foreground">
                      Your data is encrypted and protected with the highest security standards.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div className="ml-3">
                    <p className="font-medium">AI-Powered Insights</p>
                    <p className="text-muted-foreground">
                      Get personalized recommendations based on your spending patterns.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div className="ml-3">
                    <p className="font-medium">Automated Savings</p>
                    <p className="text-muted-foreground">
                      Set up smart rules to save money automatically based on your goals.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-lg shadow-lg">
                <Image
                  src="/assets/Dashboard dark-mode.png"
                  alt="App Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 rounded-lg border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <p className="text-sm font-medium">Real-time updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
