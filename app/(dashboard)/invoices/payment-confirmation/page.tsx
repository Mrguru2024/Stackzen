'use client';

import React from 'react';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui';

export default function PaymentConfirmationPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
      <Card className="mx-auto max-w-md p-8 text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <Icons.checkCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful</CardTitle>
          <CardDescription>Your invoice has been paid. Thank you!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="mt-6 w-full" onClick={() => router.push('/invoices')}>
            Return to Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
