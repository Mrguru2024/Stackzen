'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui';

export default function VerifyRequestPage() {
  return (
    <div className="container flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">Check your email</CardTitle>
          <CardDescription className="text-center">
            A sign in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <Icons.mail className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            If you don&apos;t see it, check your spam folder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
