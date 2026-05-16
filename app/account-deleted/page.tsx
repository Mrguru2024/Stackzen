'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui';
import Link from 'next/link';

function AccountDeletedContent() {
  const searchParams = useSearchParams();
  const [deletionDate, setDeletionDate] = useState<Date | null>(null);

  useEffect(() => {
    const date = searchParams.get('date');
    if (date) {
      setDeletionDate(new Date(date));
    }
  }, [searchParams]);

  return (
    <div className="container flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Account Deleted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Icons.checkCircle className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Your account has been scheduled for deletion.
            </p>
            {deletionDate && (
              <p className="text-sm text-muted-foreground">
                Your account will be permanently deleted on {deletionDate.toLocaleDateString()}.
              </p>
            )}
            <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icons.alertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Grace Period
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      During the next 30 days, you can recover your account by logging in with your
                      email and password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/login">Recover Account</Link>
            </Button>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountDeletedPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-dvh items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AccountDeletedContent />
    </Suspense>
  );
}
