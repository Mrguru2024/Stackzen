'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Stripe redirects here when the onboarding session expires. We just hand the
 * user a button that mints a fresh onboarding URL and continues the flow.
 */
export default function StripeConnectRefreshPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to create new onboarding link');
      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Could not resume Stripe setup',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsRetrying(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Onboarding session expired
          </CardTitle>
          <CardDescription>
            Don't worry — your progress is saved on Stripe. Click below to continue exactly where
            you left off.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue Stripe setup
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings/payments')}>
            Back to Payments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
