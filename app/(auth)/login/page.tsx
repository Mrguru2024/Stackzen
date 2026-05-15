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
    <div className="flex min-h-screen w-full flex-col bg-emerald-50 dark:bg-gray-900 lg:flex-row">
      <HeroSection />

      {/* Login Form Section */}
      <div className="flex w-full items-center justify-center bg-gray-900 p-8 text-white dark:bg-gray-900 lg:w-1/2">
        <div className="w-full max-w-md">
          <SigninForm />
        </div>
      </div>
    </div>
  );
}
