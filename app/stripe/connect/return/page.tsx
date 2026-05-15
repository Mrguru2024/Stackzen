'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { StripeConnectStatus } from '@/components/StripeConnectCard';

/**
 * Landing page Stripe redirects users to once their hosted onboarding flow
 * completes. We pull the latest status (POST = sync from Stripe), then route
 * them back to /settings/payments where the StripeConnectCard takes over.
 */
export default function StripeConnectReturnPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'active' | 'incomplete' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stripe/connect/status', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to refresh status');
        const status = (await res.json()) as StripeConnectStatus;
        if (cancelled) return;
        if (status.status === 'active') {
          setState('active');
          setTimeout(() => router.push('/settings/payments'), 1500);
        } else {
          setState('incomplete');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="container mx-auto max-w-xl py-16">
      <Card>
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {state === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {state === 'active' && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
            {(state === 'incomplete' || state === 'error') && (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            )}
          </div>
          <CardTitle>
            {state === 'loading' && 'Confirming your Stripe connection…'}
            {state === 'active' && 'You are all set!'}
            {state === 'incomplete' && 'Almost there'}
            {state === 'error' && 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' &&
              'Hang tight while we verify the details Stripe just collected.'}
            {state === 'active' &&
              'Your Stripe account is fully connected. Redirecting you to the Payments dashboard…'}
            {state === 'incomplete' &&
              'Stripe still needs a couple of details. Head back to Payments to continue setup.'}
            {state === 'error' &&
              'We could not reach Stripe. Try again from the Payments page in a few seconds.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3 pb-6">
          <Button onClick={() => router.push('/settings/payments')}>Back to Payments</Button>
          {state !== 'loading' && (
            <Button variant="outline" onClick={() => router.push('/income/invoices')}>
              Go to invoices
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
