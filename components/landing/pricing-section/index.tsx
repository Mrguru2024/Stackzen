'use client';

import React from 'react';

import { Button } from '@/components/ui';
import Link from 'next/link';
import { PlanComparison } from './PlanComparison';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: '$6',
    period: '/month after 14-day trial',
    description:
      'Start free, stay empowered. Budget smarter with tools designed for hustle and clarity — just $6/month after your trial.',
    features: ['Manual 40/30/30 tracker', 'CSV export', '1 goal', '1 Free mentor consultation'],
    cta: 'Start Free',
    href: '/register?plan=starter',
    popular: false,
    trial: true,
  },
  {
    name: 'Pro',
    price: '$14',
    period: '/month',
    altPrice: '$140/year',
    description:
      'Smart tools for real workers. Quote. Invoice. Get paid. Track income automatically and reach goals faster for $14/month.',
    features: [
      'All Starter features',
      'Smart quote builder',
      'Customizable & Automated saving logics (40/30/30)',
      'Invoicing tool',
      'Bank sync',
      '1 Free Mentor consult per year',
    ],
    cta: 'Start Pro',
    href: '/register?plan=pro',
    popular: true,
    trial: false,
  },
  {
    name: 'Zen Access',
    price: '$249',
    period: 'one-time',
    description:
      'Pay once. Grow forever. Lifetime access to Zen insights and monthly mentor guidance for just $249 one-time.',
    features: [
      'All Pro features',
      'Zen AI insights',
      '1x Free 30-minute mentor consult every 6 months',
      'Add-on compatible',
    ],
    cta: 'Go Zen',
    href: '/register?plan=zen',
    popular: false,
    trial: false,
  },
  {
    name: 'Zen+ Coaching',
    price: '$21',
    period: '/month',
    altPrice: '$219/year',
    description:
      'Your personal coach and financial system in one. One-on-one support, group calls, and tools to keep your growth on track.',
    features: [
      'All Zen Access features',
      '1-on-1 coaching monthly',
      'Group Q&A calls',
      'Priority support',
    ],
    cta: 'Try Zen+',
    href: '/register?plan=zenplus',
    popular: false,
    trial: false,
  },
];

export function PricingSection() {
  const [proCycle, setProCycle] = useState<'monthly' | 'annual'>('monthly');
  const [zenPlusCycle, setZenPlusCycle] = useState<'monthly' | 'annual'>('monthly');

  const _getPlan = plan => {
    if (plan.name === 'Pro') {
      return {
        ...plan,
        price: proCycle === 'monthly' ? '$14' : '$140',
        period: proCycle === 'monthly' ? '/month' : '/year',
        href: `/register?plan=pro&cycle=${proCycle}`,
      };
    }
    if (plan.name === 'Zen+ Coaching') {
      return {
        ...plan,
        price: zenPlusCycle === 'monthly' ? '$21' : '$219',
        period: zenPlusCycle === 'monthly' ? '/month' : '/year',
        href: `/register?plan=zenplus&cycle=${zenPlusCycle}`,
      };
    }
    return plan;
  };

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Choose the plan that&apos;s right for you. All plans include a 14-day free trial. No
            credit card required.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map(plan => {
            const _planData = _getPlan(plan);
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-white shadow-sm ${plan.popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold">{_planData.name}</h3>
                  {/* Toggle for Pro */}
                  {_planData.name === 'Pro' && (
                    <div className="mb-2 mt-2 flex items-center gap-2">
                      <button
                        className={`rounded-l px-3 py-1 ${proCycle === 'monthly' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                        onClick={() => setProCycle('monthly')}
                      >
                        Monthly
                      </button>
                      <button
                        className={`rounded-r px-3 py-1 ${proCycle === 'annual' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                        onClick={() => setProCycle('annual')}
                      >
                        Annual
                      </button>
                    </div>
                  )}
                  {/* Toggle for Zen+ Coaching */}
                  {_planData.name === 'Zen+ Coaching' && (
                    <div className="mb-2 mt-2 flex items-center gap-2">
                      <button
                        className={`rounded-l px-3 py-1 ${zenPlusCycle === 'monthly' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                        onClick={() => setZenPlusCycle('monthly')}
                      >
                        Monthly
                      </button>
                      <button
                        className={`rounded-r px-3 py-1 ${zenPlusCycle === 'annual' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                        onClick={() => setZenPlusCycle('annual')}
                      >
                        Annual
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight">{_planData.price}</span>
                    {_planData.period && (
                      <span className="ml-1 text-xl text-gray-500">{_planData.period}</span>
                    )}
                  </div>
                  <p className="mt-4 text-gray-600">{_planData.description}</p>

                  <ul className="mt-8 space-y-4">
                    {_planData.features.map(feature => (
                      <li key={feature} className="flex items-start">
                        <svg
                          className="h-6 w-6 flex-shrink-0 text-primary"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button className="w-full" variant={_planData.popular ? 'default' : 'outline'}>
                      <Link href={_planData.href}>{_planData.cta}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Comparison Table */}
        <PlanComparison />

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="mb-12 text-center text-2xl font-bold">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Can I change plans later?</h4>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected
                in your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Is my data secure?</h4>
              <p className="text-gray-600">
                Absolutely. We use bank-level encryption and security measures to protect your data.
                We never share your information with third parties.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">What payment methods do you accept?</h4>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers for business accounts.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Do you offer refunds?</h4>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee if you&apos;re not satisfied with our
                service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
