'use client';

import React from 'react';

import LoginForm from '@/components/auth/login-form';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Google');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-background px-4">
      <div className="w-full max-w-md">
        <div className="dark:bg-surface/80 relative flex flex-col items-center gap-6 rounded-3xl border border-primary/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-primary/30 sm:p-10">
          {/* Logo/Icon */}
          <div className="mb-2 flex items-center justify-center">
            <Image
              src="/Full size.svg"
              alt="StackZen Logo"
              width={56}
              className="dark:bg-surface h-auto w-14 rounded-full border-2 border-primary bg-white shadow-lg"
              priority
            />
          </div>
          <div className="w-full text-center">
            <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-primary">
              Welcome back
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Sign in to your StackZen account and keep your financial zen 🌱
            </p>
          </div>
          {error && (
            <div className="mb-2 w-full rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
              {error}
            </div>
          )}
          <LoginForm onError={setError} />
          <div className="relative my-2 flex w-full items-center">
            <span className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-3 text-xs text-muted-foreground">or</span>
            <span className="flex-grow border-t border-gray-200 dark:border-gray-700" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold shadow transition-all duration-150 hover:bg-accent/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-accent/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48">
              <g>
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.36 13.13 17.73 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.67 28.29c-1.13-3.36-1.13-6.93 0-10.29l-7.98-6.2C.86 15.13 0 19.44 0 24c0 4.56.86 8.87 2.69 12.2l7.98-6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.19-5.59c-2.01 1.35-4.59 2.14-8.7 2.14-6.27 0-11.64-3.63-13.33-8.79l-7.98 6.2C6.71 42.18 14.82 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
            Sign in with Google
          </button>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            You're doing better than you think 💜
          </div>
        </div>
      </div>
    </div>
  );
}
