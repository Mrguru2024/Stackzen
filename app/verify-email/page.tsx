'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          throw new Error('No verification token provided');
        }

        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify email');
        }

        setStatus('success');
        setMessage('Email verified successfully! You can now close this window.');
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(
          'Failed to verify email. The link may have expired. Please try updating your email again.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="container flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'loading' && <Icons.spinner className="h-8 w-8 animate-spin" />}
          {status === 'success' && <Icons.check className="h-8 w-8 text-green-500" />}
          {status === 'error' && <Icons.x className="h-8 w-8 text-red-500" />}
          <p className="text-center text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
