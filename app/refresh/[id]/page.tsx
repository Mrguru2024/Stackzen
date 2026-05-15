import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

interface RefreshPageProps {
  params: { id: string };
}

export default async function RefreshPage({ params }: RefreshPageProps) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: id },
    select: { stripeAccountId: true },
  });

  if (!user?.stripeAccountId) {
    redirect('/dashboard');
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  const isEnabled = account.charges_enabled && account.payouts_enabled;

  if (isEnabled) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-bold">Onboarding Session Expired</h1>
        <p className="mb-6 text-lg">
          Your Stripe onboarding session has expired or was interrupted. Please try again to
          complete the setup.
        </p>
        <div className="space-y-4">
          <a
            href="/dashboard"
            className="mr-4 inline-block rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
          >
            Return to Dashboard
          </a>
          <a
            href={`/api/stripe/connect/create-account-link?userId=${id}`}
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Retry Onboarding
          </a>
        </div>
      </div>
    </div>
  );
}
