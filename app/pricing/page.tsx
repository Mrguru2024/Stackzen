'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { calculateTax } from '@/lib/stripe/actions';

const plans = [
  {
    key: 'FREE',
    name: 'Starter',
    price: '$6.99/mo after 14-day trial',
    features: [
      'Manual 40/30/30 tracker',
      'CSV export',
      '1 goal',
      '1 Free mentor consultation',
      'Trial: 14 days free',
    ],
    cta: 'Start Free Trial',
    cycle: 'monthly',
    trial: true,
    basePrice: 6.99,
    currency: 'USD',
  },
  {
    key: 'PRO',
    name: 'Pro',
    priceMonthly: '$14.99/mo',
    priceAnnual: '$139/yr ($11.58/mo)',
    features: [
      'All Starter features',
      'Smart quote builder',
      'Customizable & Automated saving logics (40/30/30)',
      'Invoicing tool',
      'Bank sync',
      '1 Free Mentor consult per year',
    ],
    cta: 'Start Pro',
    cycle: 'monthly',
    trial: false,
    basePriceMonthly: 14.99,
    basePriceAnnual: 139,
    currency: 'USD',
  },
  {
    key: 'LIFETIME',
    name: 'Zen Access',
    price: '$249 one-time',
    features: [
      'All Pro features',
      'Lifetime access',
      'Exclusive webinars',
      'Priority support',
      'Add-on compatible',
    ],
    cta: 'Go Zen Access',
    cycle: 'one-time',
    trial: false,
    basePrice: 249,
    currency: 'USD',
  },
  {
    key: 'ZEN_PLUS',
    name: 'Zen+ Coaching',
    priceMonthly: '$49/mo',
    priceAnnual: '$499/yr (~$41.58/mo)',
    features: [
      'Exclusive coaching for Pro/Zen users: monthly expert review, accountability plan, priority support, and coaching portal access.',
      'Annual plan: 4 expert reviews, workshop invites, early feature access.',
    ],
    cta: 'Start Zen+ Coaching',
    cycle: 'monthly',
    trial: false,
    basePriceMonthly: 49,
    basePriceAnnual: 499,
    currency: 'USD',
    requiresProOrZen: true,
  },
  {
    key: 'COACHING_SESSION',
    name: '1-on-1 Coaching Session',
    price: '$65/session',
    features: [
      '45-minute Zoom call',
      'Post-session action plan',
      'Financial health audit',
      'Pay-as-you-go option',
      'Available to all users',
    ],
    cta: 'Book Session',
    cycle: 'one-time',
    trial: false,
    basePrice: 65,
    currency: 'USD',
    availableToAll: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [proCycle, setProCycle] = useState<'monthly' | 'annual'>('monthly');
  const [zenPlusCycle, setZenPlusCycle] = useState<'monthly' | 'annual'>('monthly');

  function handleSelect(planKey: string, cycle: string) {
    router.push(`/register?plan=${planKey}&cycle=${cycle}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <h1 className="mb-6 text-center text-3xl font-bold">Choose your StackZen plan</h1>
      <div className="grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-4">
        {/* Starter Plan */}
        <div className="flex flex-col rounded-xl border bg-white p-8 shadow-lg dark:bg-gray-900">
          <h2 className="mb-2 text-xl font-semibold">{plans[0].name}</h2>
          <div className="mb-4 text-2xl font-bold">{plans[0].price}</div>
          <ul className="mb-6 space-y-2 text-sm">
            {plans[0].features.map(f => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <Button
            className="mt-auto w-full"
            onClick={() => handleSelect(plans[0].key, plans[0].cycle)}
          >
            {plans[0].cta}
          </Button>
        </div>
        {/* Pro Plan */}
        <div className="flex flex-col rounded-xl border border-blue-500 bg-white p-8 shadow-lg dark:bg-gray-900">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
            {plans[1].name}
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              Most Popular
            </span>
          </h2>
          <div className="mb-2 flex gap-2">
            <Button
              type="button"
              variant={proCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant={proCycle === 'annual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProCycle('annual')}
            >
              Annual
            </Button>
          </div>
          <div className="mb-4 text-2xl font-bold">
            {proCycle === 'monthly' ? plans[1].priceMonthly : plans[1].priceAnnual}
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            {plans[1].features.map(f => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <Button className="mt-auto w-full" onClick={() => handleSelect(plans[1].key, proCycle)}>
            {plans[1].cta}
          </Button>
        </div>
        {/* Zen Access Plan */}
        <div className="flex flex-col rounded-xl border bg-white p-8 shadow-lg dark:bg-gray-900">
          <h2 className="mb-2 text-xl font-semibold">{plans[2].name}</h2>
          <div className="mb-4 text-2xl font-bold">{plans[2].price}</div>
          <ul className="mb-6 space-y-2 text-sm">
            {plans[2].features.map(f => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <Button
            className="mt-auto w-full"
            onClick={() => handleSelect(plans[2].key, plans[2].cycle)}
          >
            {plans[2].cta}
          </Button>
        </div>
        {/* Zen+ Coaching Plan */}
        <div className="flex flex-col rounded-xl border border-purple-500 bg-white p-8 shadow-lg dark:bg-gray-900">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
            {plans[3].name}
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              Premium
            </span>
          </h2>
          <div className="mb-2 flex gap-2">
            <Button
              type="button"
              variant={zenPlusCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZenPlusCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant={zenPlusCycle === 'annual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZenPlusCycle('annual')}
            >
              Annual
            </Button>
          </div>
          <div className="mb-4 text-2xl font-bold">
            {zenPlusCycle === 'monthly' ? plans[3].priceMonthly : plans[3].priceAnnual}
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            {plans[3].features.map(f => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <Button
            className="mt-auto w-full"
            onClick={() => handleSelect(plans[3].key, zenPlusCycle)}
          >
            {plans[3].cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
