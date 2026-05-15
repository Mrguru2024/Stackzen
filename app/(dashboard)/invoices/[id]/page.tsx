'use client';

import React from 'react';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

interface Invoice {
  id: string;
  number: string;
  client: {
    name: string;
    email: string | null;
  };
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  createdAt: string;
  paidAt: string | null;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params?.id as string;
  const { toast } = useToast();

  // Handle payment success/error messages
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Payment Successful',
        description: 'Your invoice has been marked as paid.',
        variant: 'default',
      });
    } else if (canceled === 'true') {
      toast({
        title: 'Payment Canceled',
        description: "Your payment was canceled. You can try again when you're ready.",
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      return response.json();
    },
    enabled: !!invoiceId,
  });

  const handlePayNow = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading invoice...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-12 text-center text-destructive">
        <Icons.alertCircle className="mx-auto mb-2 h-8 w-8" />
        <p>Failed to load invoice.</p>
        <Button className="mt-4" onClick={() => router.push('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Invoice #{invoice.number}</CardTitle>
          <CardDescription>
            {invoice.client.name} &bull; {invoice.client.email || 'No email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Due Date</div>
              <div className="font-medium">{format(new Date(invoice.dueDate), 'PPP')}</div>
            </div>
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Status</div>
              {invoice.status === 'paid' ? (
                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                  <Icons.checkCircle className="h-4 w-4" /> Paid
                </span>
              ) : invoice.status === 'overdue' ? (
                <span className="inline-flex items-center gap-1 font-medium text-red-600">
                  <Icons.alertCircle className="h-4 w-4" /> Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-yellow-600">
                  <Icons.clock className="h-4 w-4" /> Pending
                </span>
              )}
            </div>
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{formatCurrency(invoice.amount)}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 font-semibold">Line Items</div>
            <div className="overflow-x-auto">
              <table className="min-w-full rounded border text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-t">
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

          <div className="mt-6 flex gap-2">
            {invoice.status === 'pending' && (
              <Button onClick={handlePayNow} className="flex items-center gap-2">
                <Icons.creditCard className="h-4 w-4" />
                Pay Now
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/invoices/${invoice.id}/download`)}
            >
              <Icons.download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" onClick={() => router.push('/invoices')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
