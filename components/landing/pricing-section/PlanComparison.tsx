import React from 'react';
import { Check, Minus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { PLAN_COMPARISON_FEATURES } from '@/lib/pricing/plan-comparison';
import { cn } from '@/lib/utils';

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

function cycleToggleClass(active: boolean) {
  return cn(
    'min-h-[2rem] flex-1 px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground'
  );
}

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
    <div className="mx-auto mt-16 max-w-5xl px-1 sm:px-0">
      <h3 className="mb-6 text-center text-2xl font-bold tracking-tight text-foreground">
        Compare plans
      </h3>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
        Same features as the cards above—at a glance for you or your accountant.
      </p>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
        <div className="inline-block min-w-full align-middle sm:min-w-[640px]">
          <div className="rounded-xl border border-border shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-[32%] sm:w-[28%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 align-bottom text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:p-4 sm:text-sm">
                Feature
              </th>
              {_planHeaders.map(plan => (
                <th key={plan.name} className="p-3 align-bottom text-center sm:p-4">
                  <div className="flex min-h-[4.5rem] flex-col items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-foreground sm:text-base">
                      {plan.name}
                    </span>
                    {plan.toggle ? (
                      <div
                        className="inline-flex w-full max-w-[9.5rem] rounded-lg border border-border bg-background p-0.5 shadow-inner"
                        role="group"
                        aria-label={`${plan.name} billing`}
                      >
                        <button
                          type="button"
                          className={cn(
                            cycleToggleClass(
                              (plan.name === 'Pro' && proCycle === 'monthly') ||
                                (plan.name === 'Zen+ Coaching' && zenPlusCycle === 'monthly')
                            ),
                            'rounded-md'
                          )}
                          onClick={() =>
                            plan.name === 'Pro'
                              ? setProCycle('monthly')
                              : setZenPlusCycle('monthly')
                          }
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          className={cn(
                            cycleToggleClass(
                              (plan.name === 'Pro' && proCycle === 'annual') ||
                                (plan.name === 'Zen+ Coaching' && zenPlusCycle === 'annual')
                            ),
                            'rounded-md'
                          )}
                          onClick={() =>
                            plan.name === 'Pro' ? setProCycle('annual') : setZenPlusCycle('annual')
                          }
                        >
                          Annual
                        </button>
                      </div>
                    ) : null}
                    <span className="text-xs font-normal leading-snug text-muted-foreground">
                      {plan.price}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {PLAN_COMPARISON_FEATURES.map(feature => (
              <tr key={feature.label} className="transition-colors hover:bg-muted/30">
                <td className="p-3 align-middle text-xs font-medium text-foreground sm:p-4 sm:text-sm">
                  {feature.label}
                </td>
                {[feature.starter, feature.pro, feature.zen, feature.zenplus].map((val, idx) => (
                  <td key={idx} className="p-3 align-middle text-center sm:p-4">
                    {val === true && (
                      <Check
                        className="mx-auto inline h-5 w-5 text-primary"
                        aria-label="Included"
                      />
                    )}
                    {val === false && (
                      <Minus
                        className="mx-auto inline h-5 w-5 text-muted-foreground/50"
                        aria-label="Not included"
                      />
                    )}
                    {typeof val === 'string' && (
                      <span className="inline-block max-w-[10rem] text-xs font-semibold leading-snug text-primary sm:text-sm">
                        {val}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

          <div className="grid grid-cols-5 gap-2 border-t border-border bg-muted/20 px-2 py-3 sm:gap-3 sm:px-3">
            <div aria-hidden className="min-w-0" />
            {_plans.map(plan => (
              <div key={plan.name} className="flex min-w-0 items-stretch">
                <Button
                  variant="default"
                  className="h-10 w-full min-w-0 px-1.5 text-[0.7rem] leading-tight sm:h-11 sm:px-3 sm:text-sm"
                  asChild
                >
                  <Link
                    href={plan.href}
                    className="flex min-w-0 items-center justify-center text-center !text-primary-foreground no-underline hover:!text-primary-foreground/90"
                  >
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
