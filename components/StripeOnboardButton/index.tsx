'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripeOnboardButtonProps {
  userId: string;
  className?: string;
}

export function StripeOnboardButton({ userId, className }: StripeOnboardButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOnboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account link');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating account link:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect Stripe account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleOnboard} disabled={isLoading} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Stripe Account'
      )}
    </Button>
  );
}

export default StripeOnboardButton;
