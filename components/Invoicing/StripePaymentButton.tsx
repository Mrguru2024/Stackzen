'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/app/hooks/use-toast';
import { CreditCard } from 'lucide-react';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StripePaymentButtonProps {
  invoiceId: string;
  amount: number;
  client: {
    id: string;
    name: string;
    email?: string;
  };
  onSuccess?: () => void;
}

export function StripePaymentButton({
  invoiceId,
  amount,
  client,
  onSuccess,
}: StripePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!client.email) {
        throw new Error('Client email is required for payment');
      }

      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: client.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment session');
      }

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      setError(message);
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handlePayment}
        disabled={isLoading || !client.email}
        className="bg-primary hover:bg-primary/90"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>

      {!client.email && (
        <p className="text-sm text-muted-foreground">
          Client email is required for payment processing
        </p>
      )}
    </div>
  );
}
