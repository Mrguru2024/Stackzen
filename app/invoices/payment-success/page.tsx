'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntent || !paymentIntentClientSecret) {
      setStatus('error');
      setMessage('Invalid payment information');
      return;
    }

    // Verify the payment status
    fetch(`/api/invoices/verify-payment?payment_intent=${paymentIntent}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'succeeded') {
          setStatus('success');
          setMessage('Payment successful! Your invoice has been marked as paid.');
        } else {
          setStatus('error');
          setMessage('Payment failed. Please try again.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Error verifying payment. Please contact support.');
      });
  }, [searchParams]);

  return (
    <div className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' ? 'Processing Payment' : 'Payment Status'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' ? 'Please wait while we verify your payment...' : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          )}
          {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
          {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          <Button onClick={() => router.push('/invoices')} className="w-full">
            Return to Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
