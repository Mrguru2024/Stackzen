'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MentorPortalLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <Image
            src="/Full size.svg"
            alt="StackZen"
            width={48}
            height={48}
            className="mx-auto mb-2 rounded-full"
          />
          <CardTitle>Mentor portal sign in</CardTitle>
          <CardDescription>
            Access your mentor dashboard, sessions, and client tools. New here?{' '}
            <Link href="/become-mentor" className="font-medium text-primary underline">
              Apply to mentor
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl="/mentor-portal/dashboard" />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/auth/signin" className="underline">
              Member sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
