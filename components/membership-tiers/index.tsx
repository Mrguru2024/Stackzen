import React from 'react';
import { prisma } from '@/lib/prisma';

export type MembershipTiersProps = Record<string, never>;

export default async function MembershipTiers({}: MembershipTiersProps) {
  // Fetch membership tiers and user info (placeholder, adjust model as needed)
  const [tiers, user] = await Promise.all([
    prisma.membershipTier.findMany({ orderBy: { price: 'asc' } }),
    prisma.user.findFirst(),
  ]);
  const userTierId = user?.membershipTierId;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Membership Tiers</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier: any) => (
          <div
            key={tier.id}
            className={`flex flex-col items-center rounded-lg border-2 bg-white p-6 shadow transition-all dark:bg-gray-900 ${userTierId === tier.id ? 'border-primary' : 'border-transparent'}`}
          >
            <div className="mb-2 text-xl font-semibold dark:text-white">{tier.name}</div>
            <div className="mb-4 text-3xl font-bold dark:text-white">
              ${tier.price?.toFixed(2) ?? '0.00'}/mo
            </div>
            <ul className="mb-6 list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
              {tier.features?.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {userTierId === tier.id ? (
              <span className="rounded bg-primary px-4 py-2 font-semibold text-white">
                Current Plan
              </span>
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
