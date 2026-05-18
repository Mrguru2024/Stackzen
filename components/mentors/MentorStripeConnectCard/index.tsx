'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, CircleDollarSign, ExternalLink, Loader2, RefreshCcw } from 'lucide-react';
import type { StripeConnectStatus } from '@/components/StripeConnectCard';

const STATUS_COPY: Record<
  StripeConnectStatus['status'],
  { label: string; description: string }
> = {
  not_connected: {
    label: 'Not connected',
    description:
      'Connect Stripe to receive mentorship session payouts directly. This is separate from invoice payouts under Settings → Payments.',
  },
  onboarding: {
    label: 'Finish setup',
    description: 'Complete Stripe onboarding to unlock session earnings deposits.',
  },
  restricted: {
    label: 'Action needed',
    description: 'Stripe needs additional information before session payouts can be sent.',
  },
  active: {
    label: 'Payouts active',
    description: 'Session payments split automatically: your share deposits to this Stripe account.',
  },
};

export function MentorStripeConnectCard() {
  const { toast } = useToast();
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (sync = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentors/connect/status', {
        method: sync ? 'POST' : 'GET',
      });
      if (!res.ok) throw new Error('Failed to load status');
      setStatus((await res.json()) as StripeConnectStatus);
    } catch {
      toast({
        title: 'Could not load payout status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const startOnboard = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/mentors/connect/onboard', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Onboarding failed');
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: 'Could not open Stripe',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const s = status ?? {
    connected: false,
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    status: 'not_connected' as const,
    pendingRequirements: [],
  };

  const copy = STATUS_COPY[s.status];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          Session payout account
        </CardTitle>
        <CardDescription>
          For mentorship session earnings only — not the same as client invoice Connect under{' '}
          <span className="font-medium">Settings → Payments</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{copy.label}</Badge>
          {s.status === 'active' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
        {s.pendingRequirements.length > 0 ? (
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {s.pendingRequirements.slice(0, 4).map(req => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {s.status !== 'active' ? (
          <Button onClick={() => void startOnboard()} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Connect Stripe for payouts
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void load(true)} disabled={loading} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
