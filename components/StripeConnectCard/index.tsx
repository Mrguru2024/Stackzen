'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';

export type StripeConnectStatus = {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  status: 'not_connected' | 'onboarding' | 'restricted' | 'active';
  disabledReason?: string | null;
  pendingRequirements: string[];
};

export interface StripeConnectCardProps {
  /** Optional initial status — useful when rendering server-side. */
  initialStatus?: StripeConnectStatus;
  /** Override fetch implementation in tests/Storybook. */
  fetcher?: typeof fetch;
  /** Render in compact mode (no help copy) — used inline in invoice screens. */
  compact?: boolean;
  /** Called whenever status changes; lets parents re-render dependent UI. */
  onStatusChange?: (status: StripeConnectStatus) => void;
}

const STATUS_COPY: Record<
  StripeConnectStatus['status'],
  { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; description: string }
> = {
  not_connected: {
    label: 'Not connected',
    tone: 'secondary',
    description:
      'Link your Stripe account so clients can pay your invoices online with a credit card or bank transfer.',
  },
  onboarding: {
    label: 'Finish setup',
    tone: 'warning',
    description:
      'You started the Stripe sign-up but a few details are still missing. Finish onboarding to start accepting payments.',
  },
  restricted: {
    label: 'Action needed',
    tone: 'destructive',
    description:
      'Stripe paused your account until extra information is provided. Continue onboarding to unlock payments.',
  },
  active: {
    label: 'Ready to accept payments',
    tone: 'success',
    description: 'Your Stripe account is connected and clients can pay invoices online.',
  },
};

const HUMAN_FRIENDLY_REQUIREMENTS: Record<string, string> = {
  'individual.id_number': 'Government-issued ID number',
  'individual.dob.day': 'Date of birth',
  'individual.address.line1': 'Home or business address',
  'individual.email': 'Email address',
  'individual.phone': 'Phone number',
  'business_profile.url': 'Business website or social profile',
  'business_profile.mcc': 'Type of business',
  external_account: 'Bank account for payouts',
  tos_acceptance: 'Accept Stripe terms of service',
};

function humanizeRequirement(key: string): string {
  if (HUMAN_FRIENDLY_REQUIREMENTS[key]) return HUMAN_FRIENDLY_REQUIREMENTS[key];
  return key
    .replace(/[._]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
}

/** Bound fetch — passing bare `fetch` as a value breaks in browsers (`Illegal invocation`). */
const defaultFetcher: typeof fetch | undefined =
  typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined;

export function StripeConnectCard({
  initialStatus,
  fetcher = defaultFetcher,
  compact = false,
  onStatusChange,
}: StripeConnectCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<StripeConnectStatus | null>(initialStatus ?? null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(!initialStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const apply = useCallback(
    (next: StripeConnectStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const fetchStatus = useCallback(
    async (sync = false) => {
      if (!fetcher) return;
      const url = '/api/stripe/connect/status';
      const init: RequestInit = sync
        ? { method: 'POST', credentials: 'include' }
        : { credentials: 'include' };
      const res = await fetcher(url, init);
      if (!res.ok) throw new Error('Failed to load Stripe status');
      apply((await res.json()) as StripeConnectStatus);
    },
    [apply, fetcher]
  );

  useEffect(() => {
    if (initialStatus) return;
    setIsLoadingStatus(true);
    void fetchStatus()
      .catch((err: unknown) => {
        console.error(err);
        toast({
          title: 'Could not load Stripe status',
          description: 'Refresh the page or try again.',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoadingStatus(false));
  }, [fetchStatus, initialStatus, toast]);

  const handleConnect = async () => {
    if (!fetcher) {
      toast({
        title: 'Stripe connection failed',
        description: 'This browser environment does not support network requests. Try another browser or update the page.',
        variant: 'destructive',
      });
      return;
    }
    setIsStartingOnboarding(true);
    try {
      const res = await fetcher('/api/stripe/connect/onboard', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not start Stripe onboarding');
      }
      const { url } = (await res.json()) as { url: string };
      if (!url) throw new Error('Stripe did not return an onboarding link');
      window.location.href = url;
    } catch (err) {
      toast({
        title: 'Stripe connection failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsStartingOnboarding(false);
    }
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await fetchStatus(true);
      toast({ title: 'Stripe status updated' });
    } catch (err) {
      toast({
        title: 'Could not refresh status',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!fetcher) return;
    setIsDisconnecting(true);
    try {
      const res = await fetcher('/api/stripe/connect/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Could not disconnect');
      await fetchStatus();
      toast({ title: 'Stripe disconnected', description: 'You can reconnect at any time.' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Disconnect failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const current = status?.status ?? 'not_connected';
  const copy = STATUS_COPY[current];

  return (
    <Card data-testid="stripe-connect-card">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Online payments via Stripe</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </div>
          </div>
          <Badge variant={copy.tone} aria-label={`Status: ${copy.label}`}>
            {copy.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!compact && (
          <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium">Stripe handles security</p>
                <p className="text-muted-foreground">
                  Card data never touches StackZen. PCI compliance is built in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium">Built into every invoice</p>
                <p className="text-muted-foreground">
                  Each invoice you send includes a secure payment page — clients pay with one click.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium">Money goes to you</p>
                <p className="text-muted-foreground">
                  Payouts land directly in your bank from Stripe — usually in 2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {status && status.connected && status.pendingRequirements.length > 0 && (
          <div
            role="status"
            className="flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-900/20 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Stripe still needs a few things</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {status.pendingRequirements.slice(0, 5).map(req => (
                  <li key={req}>{humanizeRequirement(req)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {status?.disabledReason && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Account paused by Stripe</p>
              <p>{status.disabledReason.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {!status?.connected && (
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isStartingOnboarding || isLoadingStatus}
            className="gap-2"
            data-testid="stripe-connect-card-connect"
          >
            {isStartingOnboarding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Connect with Stripe
          </Button>
        )}

        {status?.connected && current !== 'active' && (
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isStartingOnboarding}
            className="gap-2"
            data-testid="stripe-connect-card-continue"
          >
            {isStartingOnboarding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Continue Stripe setup
          </Button>
        )}

        {status?.connected && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="gap-2"
            data-testid="stripe-connect-card-refresh"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh status
          </Button>
        )}

        {status?.connected && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="gap-2 text-muted-foreground"
            data-testid="stripe-connect-card-disconnect"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unplug className="h-4 w-4" />
            )}
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default StripeConnectCard;
