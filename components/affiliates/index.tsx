import React from 'react';
import { prisma } from '@/lib/prisma';

export type AffiliatesProps = Record<string, never>;

export default async function Affiliates({}: AffiliatesProps) {
  // Fetch user affiliate data (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { affiliate: true } });
  const affiliate = user?.affiliate;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Referral & Affiliates</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold dark:text-white">StackZen Referral Program</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Invite friends to StackZen and earn rewards! Share your unique referral code below. For
          every friend who signs up and upgrades, you earn $10.
        </p>
        <div className="mb-4 flex items-center gap-4">
          <span
            className="font-mono select-all rounded bg-gray-100 px-3 py-1 text-lg dark:bg-gray-800"
            data-testid="referral-code"
          >
            {affiliate?.code ?? 'N/A'}
          </span>
          <button
            className="hover:bg-primary-dark rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            type="button"
            aria-label="Copy referral code"
            onClick={async () => {
              if (affiliate?.code) await navigator.clipboard.writeText(affiliate.code);
            }}
          >
            Copy
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">{affiliate?.signups ?? 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Signups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">
              ${affiliate?.earnings?.toFixed(2) ?? '0.00'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Earnings</div>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h3 className="mb-2 font-semibold dark:text-white">How it works</h3>
        <ol className="list-inside list-decimal space-y-1 text-gray-700 dark:text-gray-300">
          <li>Share your referral code with friends.</li>
          <li>They sign up and enter your code.</li>
          <li>When they upgrade, you earn rewards.</li>
        </ol>
      </div>
    </div>
  );
}
