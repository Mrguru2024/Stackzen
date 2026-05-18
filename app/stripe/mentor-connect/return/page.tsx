'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { StripeConnectStatus } from '@/components/StripeConnectCard';

export default function MentorStripeConnectReturnPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'active' | 'incomplete' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/mentors/connect/status', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to refresh status');
        const status = (await res.json()) as StripeConnectStatus;
        if (cancelled) return;
        if (status.status === 'active') {
          setState('active');
          setTimeout(() => router.push('/mentor-portal/dashboard?tab=billing'), 1500);
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
          <CardTitle>
            {state === 'loading' && 'Confirming mentor payouts…'}
            {state === 'active' && 'Payouts are ready'}
            {state === 'incomplete' && 'Almost there'}
            {state === 'error' && 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {state === 'active'
              ? 'Session earnings will deposit to your connected Stripe account. Redirecting…'
              : 'Finish Stripe setup to receive mentorship session payouts.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          {state === 'loading' ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Button onClick={() => router.push('/mentor-portal/dashboard?tab=billing')}>
              Back to mentor portal
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
