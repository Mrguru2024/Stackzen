import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

interface ReturnPageProps {
  params: { id: string };
}

export default async function ReturnPage({ params }: ReturnPageProps) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-bold">
          {isEnabled ? 'Stripe Account Connected!' : 'Almost There!'}
        </h1>
        <p className="mb-6 text-lg">
          {isEnabled
            ? 'Your Stripe account is fully set up and ready to accept payments.'
            : "Your Stripe account is being reviewed. We'll notify you once it's ready."}
        </p>
        <a
          href="/dashboard"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
