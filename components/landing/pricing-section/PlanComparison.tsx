import React from 'react';
import { Check, Minus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const _features = [
  { label: 'Manual 40/30/30 tracker', starter: true, pro: true, zen: true, zenplus: true },
  { label: 'CSV export', starter: true, pro: true, zen: true, zenplus: true },
  { label: '1 goal', starter: true, pro: true, zen: true, zenplus: true },
  {
    label: 'Free mentor consults',
    starter: '1 consult',
    pro: '1/year',
    zen: '1/6mo (30min)',
    zenplus: '1-on-1/mo',
  },
  { label: 'Smart quote builder', starter: false, pro: true, zen: true, zenplus: true },
  {
    label: 'Customizable & Automated saving logics (40/30/30)',
    starter: false,
    pro: true,
    zen: true,
    zenplus: true,
  },
  { label: 'Invoicing tool', starter: false, pro: true, zen: true, zenplus: true },
  { label: 'Bank sync', starter: false, pro: true, zen: true, zenplus: true },
  { label: 'Zen AI insights', starter: false, pro: false, zen: true, zenplus: true },
  { label: 'Add-on compatible', starter: false, pro: false, zen: true, zenplus: true },
  { label: '1-on-1 coaching', starter: false, pro: false, zen: false, zenplus: true },
  { label: 'Group Q&A calls', starter: false, pro: false, zen: false, zenplus: true },
  { label: 'Priority support', starter: false, pro: false, zen: false, zenplus: true },
];

const _plans = [
  {
    name: 'Starter',
    cta: 'Start Free',
    href: '/register?plan=starter',
    price: '$6/mo after trial',
  },
  { name: 'Pro', cta: 'Start Pro', href: '/register?plan=pro', price: '$14/mo or $140/yr' },
  { name: 'Zen Access', cta: 'Go Zen', href: '/register?plan=zen', price: '$249 one-time' },
  {
    name: 'Zen+ Coaching',
    cta: 'Try Zen+',
    href: '/register?plan=zenplus',
    price: '$21/mo or $219/yr',
  },
];

export function PlanComparison() {
  const [proCycle, setProCycle] = useState<'monthly' | 'annual'>('monthly');
  const [zenPlusCycle, setZenPlusCycle] = useState<'monthly' | 'annual'>('monthly');
  const _planHeaders = [
    { name: 'Starter', price: '$6/mo after trial' },
    { name: 'Pro', price: proCycle === 'monthly' ? '$14/mo' : '$140/yr', toggle: true },
    { name: 'Zen Access', price: '$249 one-time' },
    {
      name: 'Zen+ Coaching',
      price: zenPlusCycle === 'monthly' ? '$21/mo' : '$219/yr',
      toggle: true,
    },
  ];

  return (
    <div className="mx-auto mt-20 max-w-5xl">
      <h3 className="mb-8 text-center text-2xl font-bold">Compare Plans</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-xl border bg-white dark:bg-gray-900">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">Feature</th>
              {_planHeaders.map((plan, idx) => (
                <th key={plan.name} className="px-4 py-3 text-center font-semibold">
                  {plan.name}
                  <div className="flex flex-col items-center text-xs font-normal text-gray-500">
                    {plan.toggle ? (
                      <div className="mb-1 flex gap-1">
                        <button
                          className={`rounded-l px-2 py-0.5 ${(plan.name === 'Pro' && proCycle === 'monthly') || (plan.name === 'Zen+ Coaching' && zenPlusCycle === 'monthly') ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                          onClick={() =>
                            plan.name === 'Pro'
                              ? setProCycle('monthly')
                              : setZenPlusCycle('monthly')
                          }
                        >
                          Monthly
                        </button>
                        <button
                          className={`rounded-r px-2 py-0.5 ${(plan.name === 'Pro' && proCycle === 'annual') || (plan.name === 'Zen+ Coaching' && zenPlusCycle === 'annual') ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                          onClick={() =>
                            plan.name === 'Pro' ? setProCycle('annual') : setZenPlusCycle('annual')
                          }
                        >
                          Annual
                        </button>
                      </div>
                    ) : null}
                    {plan.price}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {_features.map(feature => (
              <tr key={feature.label} className="border-t">
                <td className="px-4 py-3 font-medium">{feature.label}</td>
                {[feature.starter, feature.pro, feature.zen, feature.zenplus].map((val, idx) => (
                  <td key={idx} className="px-4 py-3 text-center">
                    {val === true && <Check className="inline h-5 w-5 text-green-500" />}
                    {val === false && <Minus className="inline h-5 w-5 text-gray-400" />}
                    {typeof val === 'string' && (
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{val}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="hidden lg:block" aria-hidden="true" />
        {_plans.map(plan => (
          <Link
            key={plan.name}
            href={plan.href}
            className="inline-flex w-full items-center justify-center rounded bg-primary px-6 py-3 text-center font-semibold text-white shadow transition hover:bg-primary/90"
          >
            {plan.cta}
          </Link>
        ))}
      </div>
    </div>
  );
}
