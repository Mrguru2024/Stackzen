'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, ExternalLink, Loader2, Zap } from 'lucide-react';

export interface InvoicePaymentLinkButtonProps {
  invoiceId: string;
  /** When set, the button starts in the "link already generated" state. */
  initialPaymentUrl?: string | null;
  /** When false, the button is disabled with a "Connect Stripe first" tooltip. */
  stripeReady: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  /** Callback fired once a hosted URL is available. */
  onGenerated?: (url: string) => void;
  /** Override fetch in tests/Storybook. */
  fetcher?: typeof fetch;
}

/**
 * One-click "Get paid online" action for an invoice. The first click mints a
 * Stripe hosted-invoice URL; subsequent clicks copy it to the clipboard so the
 * user can paste it into an email, SMS, or chat with the client.
 */
export function InvoicePaymentLinkButton({
  invoiceId,
  initialPaymentUrl = null,
  stripeReady,
  size = 'sm',
  variant = 'default',
  onGenerated,
  fetcher = typeof fetch !== 'undefined' ? fetch : undefined,
}: InvoicePaymentLinkButtonProps) {
  const { toast } = useToast();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialPaymentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleGenerate = async () => {
    if (!fetcher) return;
    setIsLoading(true);
    try {
      const res = await fetcher(`/api/invoices/${invoiceId}/payment-link`, { method: 'POST' });
      const payload = (await res.json().catch(() => null)) as
        | { hostedInvoiceUrl?: string; error?: string }
        | null;
      if (!res.ok || !payload?.hostedInvoiceUrl) {
        throw new Error(payload?.error ?? 'Could not create payment link');
      }
      setPaymentUrl(payload.hostedInvoiceUrl);
      onGenerated?.(payload.hostedInvoiceUrl);
      toast({
        title: 'Payment link ready',
        description: 'Stripe just emailed your client. Copy the link to share elsewhere.',
      });
    } catch (err) {
      toast({
        title: 'Could not create payment link',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setJustCopied(true);
      toast({ title: 'Copied!', description: 'Payment link copied to your clipboard.' });
      setTimeout(() => setJustCopied(false), 1600);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Open the link in a new tab and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  if (!stripeReady) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size={size}
                variant={variant}
                disabled
                className="gap-2"
                data-testid="invoice-payment-link-disabled"
              >
                <Zap className="h-4 w-4" />
                Get paid online
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Connect Stripe in Settings → Payments first.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (paymentUrl) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size={size}
          variant="outline"
          asChild
          className="gap-2"
          data-testid="invoice-payment-link-open"
        >
          <a href={paymentUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="h-4 w-4" />
            Open payment page
          </a>
        </Button>
        <Button
          size={size}
          variant="ghost"
          onClick={handleCopy}
          className="gap-2"
          data-testid="invoice-payment-link-copy"
        >
          {justCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {justCopied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleGenerate}
      disabled={isLoading}
      className="gap-2"
      data-testid="invoice-payment-link-generate"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      Get paid online
    </Button>
  );
}

export default InvoicePaymentLinkButton;
