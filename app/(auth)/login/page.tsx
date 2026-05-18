'use client';
import React from 'react';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/auth/hero-section';
import SigninForm from '@/components/auth/signin-form';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background lg:flex-row">
      <HeroSection />

      {/* Login Form Section */}
      <div className="flex w-full items-center justify-center border-t border-border bg-card p-6 sm:p-8 lg:w-1/2 lg:border-l lg:border-t-0">
        <div className="w-full max-w-md">
          <SigninForm />
        </div>
      </div>
    </div>
  );
}
