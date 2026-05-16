import React from 'react';
import type { SubscriptionLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type MembershipTiersProps = Record<string, never>;

const STATIC_TIERS: Array<{
  id: SubscriptionLevel;
  name: string;
  price: number;
  features: string[];
}> = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    features: ['Core budgeting', 'Limited goals', 'Community support'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 14,
    features: ['Invoicing & quotes', 'Income tracking', 'Bank sync', 'Priority email support'],
  },
  {
    id: 'LIFETIME',
    name: 'Zen Access',
    price: 249,
    features: ['All Pro features', 'Lifetime access', 'Zen AI insights'],
  },
  {
    id: 'ZEN_PLUS',
    name: 'Zen+',
    price: 21,
    features: ['All Zen Access', '1:1 coaching', 'Group Q&A', 'Priority support'],
  },
  {
    id: 'COACHING_SESSION',
    name: 'Coaching session',
    price: 0,
    features: ['Single paid session add-on', 'Book when you need it'],
  },
];

function formatTierPrice(tier: (typeof STATIC_TIERS)[number]): string {
  if (tier.id === 'FREE') return 'Free';
  if (tier.id === 'LIFETIME') return `$${tier.price.toFixed(0)} one-time`;
  if (tier.id === 'COACHING_SESSION') return 'Per session';
  return `$${tier.price.toFixed(2)}/mo`;
}

export default async function MembershipTiers({}: MembershipTiersProps) {
  const user = await prisma.user.findFirst();
  const currentLevel = user?.subscriptionLevel ?? 'FREE';

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Membership Tiers</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STATIC_TIERS.map(tier => (
          <div
            key={tier.id}
            className={`flex flex-col items-center rounded-lg border-2 bg-white p-6 shadow transition-all dark:bg-gray-900 ${currentLevel === tier.id ? 'border-primary' : 'border-transparent'}`}
          >
            <div className="mb-2 text-xl font-semibold dark:text-white">{tier.name}</div>
            <div className="mb-4 text-3xl font-bold dark:text-white">{formatTierPrice(tier)}</div>
            <ul className="mb-6 list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
              {tier.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {currentLevel === tier.id ? (
              <span className="rounded bg-primary px-4 py-2 font-semibold text-white">Current Plan</span>
            ) : (
              <button
                className="hover:bg-primary-dark rounded bg-primary px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary"
                type="button"
                aria-label={`Upgrade to ${tier.name}`}
              >
                Upgrade
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
