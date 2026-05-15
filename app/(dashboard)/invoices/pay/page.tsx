'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string | null;
  invoiceNumber: string;
  dueDate: string;
  paymentMethod: string;
  total: string;
  paid: boolean;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  createdAt: string;
  paidAt: string | null;
}

interface BusinessInfo {
  companyLogo?: string;
  businessName?: string;
  contactEmail?: string;
  businessAddress?: string;
  businessPhone?: string;
}

function PaymentForm({ clientSecret, invoiceId }: { clientSecret: string; invoiceId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { theme } = useTheme();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);

  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<Invoice>({
    queryKey: ['/api/invoices', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      const invoiceData = await response.json();
      // Fetch business info for the invoice owner
      fetch(`/api/profile?user_id=${invoiceData.userId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(profile => {
          if (profile) {
            setBusinessInfo({
              companyLogo: profile.businessInfo?.companyLogoUrl || profile.companyLogo || '',
              businessName: profile.businessInfo?.companyName || profile.businessName || '',
              contactEmail: profile.personalInfo?.email || profile.email || '',
              businessAddress: profile.businessInfo?.address || profile.businessAddress || '',
              businessPhone: profile.businessInfo?.phone || profile.businessPhone || '',
            });
          }
        });
      return invoiceData;
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/invoices/payment-confirmation`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setPaymentError(result.error.message || 'An unexpected error occurred.');
      toast({
        title: 'Payment failed',
        description: result.error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        toast({
          title: 'Payment successful',
          description: 'Thank you for your payment!',
        });

        setTimeout(() => {
          router.push('/income/invoices');
        }, 3000);
      }
    }

    setIsLoading(false);
  };

  if (isLoadingInvoice || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 mt-2 text-muted-foreground">Loading invoice details...</p>
      </div>
    );
  }

  if (invoice.paid) {
    return (
      <div className="mx-auto my-8 max-w-md text-center">
        <div className="flex justify-center">
          <Icons.checkCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">This invoice has already been paid</h2>
        <p className="mt-2 text-muted-foreground">
          Invoice #{invoice.invoiceNumber} for {formatCurrency(parseFloat(invoice.total))} was paid
          on {invoice.paidAt ? format(new Date(invoice.paidAt), 'PPP') : 'a previous date'}.
        </p>
        <Button className="mt-6" onClick={() => router.push('/income/invoices')}>
          Return to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-xl space-y-8">
      {/* Branding and business info */}
      <div className="mb-4 flex items-center gap-4">
        <Avatar className="bg-surface h-14 w-14 border border-gray-200 dark:border-gray-700">
          <AvatarImage src={businessInfo?.companyLogo || '/Full size.svg'} alt="Company Logo" />
          <AvatarFallback>{businessInfo?.businessName?.[0] || 'SZ'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-primary">
            {businessInfo?.businessName || 'StackZen'}
          </h2>
          {businessInfo?.contactEmail && (
            <p className="text-sm text-muted-foreground">{businessInfo.contactEmail}</p>
          )}
          {businessInfo?.businessPhone && (
            <p className="text-sm text-muted-foreground">{businessInfo.businessPhone}</p>
          )}
          {businessInfo?.businessAddress && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {businessInfo.businessAddress}
            </p>
          )}
          {!businessInfo?.contactEmail &&
            !businessInfo?.businessPhone &&
            !businessInfo?.businessAddress && (
              <p className="text-sm text-muted-foreground">Peace of mind meets profit-minded.</p>
            )}
        </div>
      </div>
      {/* Invoice summary */}
      <Card className="bg-surface/80 shadow-lg">
        <CardHeader>
          <CardTitle>Invoice Payment</CardTitle>
          <CardDescription>
            Please review your invoice and complete payment below. All payments are secure and
            encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Number:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due:</span>
              <span className="font-medium text-accent">
                {formatCurrency(parseFloat(invoice.total))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">{format(new Date(invoice.dueDate), 'PPP')}</span>
            </div>
          </div>
          {/* Line items */}
          <div className="mt-4">
            <h4 className="text-default mb-2 font-semibold">Line Items</h4>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Payment form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-medium">Payment Details</h3>
              <PaymentElement />
            </div>
            {paymentError && (
              <div className="flex items-start rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                <Icons.alertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>{paymentError}</p>
              </div>
            )}
            {paymentSuccess && (
              <div className="flex items-start rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                <Icons.checkCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>Payment processed successfully! Redirecting to invoices page...</p>
              </div>
            )}
            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90"
                disabled={!stripe || !elements || isLoading || paymentSuccess}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(parseFloat(invoice.total))}`
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/income/invoices')}
              >
                Back to Invoices
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Payments are processed securely. Need help?{' '}
              <a href="mailto:support@stackzen.com" className="text-accent underline">
                Contact support
              </a>
              .
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PayInvoicePage() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('client_secret');
  const invoiceId = searchParams.get('invoice_id');

  if (!clientSecret || !invoiceId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Payment Link</CardTitle>
            <CardDescription>This payment link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = '/income/invoices')}>
              Return to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Pay Invoice</CardTitle>
          <CardDescription>Complete your payment securely using the form below</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#5E2DEB',
                },
              },
            }}
          >
            <PaymentForm clientSecret={clientSecret} invoiceId={invoiceId} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
