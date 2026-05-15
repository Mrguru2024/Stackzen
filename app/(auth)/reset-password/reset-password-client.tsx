'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClientOptional } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Progress from '@/components/ui/progress';
import { validatePassword, type PasswordStrength } from '@/lib/auth/password';

type AuthError = {
  message: string;
  status?: number;
};

function stripOAuthQueryParamsFromAddressBar(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  const q = url.searchParams.toString();
  window.history.replaceState(null, '', `${url.pathname}${q ? `?${q}` : ''}${url.hash}`);
}

function stripHashFromAddressBar(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [resolvedPrismaToken, setResolvedPrismaToken] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<
    typeof createBrowserClientOptional
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const prismaToken = params.get('token')?.trim() ?? '';
    const pkceCode = params.get('code')?.trim() ?? '';

    /** Prisma emailed link — no Supabase session needed; show form immediately. */
    if (prismaToken) {
      setResolvedPrismaToken(prismaToken);
      setLinkState('ready');
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const supabase = createBrowserClientOptional();
    setSupabaseClient(supabase);

    if (!supabase) {
      setLinkState('invalid');
      setError({
        message:
          'Password recovery is not fully configured (missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY). Add those env vars for email recovery, or use the password reset link that includes ?token= from StackZen.',
      });
      return () => {
        cancelled = true;
      };
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) {
        setLinkState('ready');
        setError(null);
      }
    });

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    void (async () => {
      const { data: initial } = await supabase.auth.getSession();
      if (cancelled) return;
      if (initial.session) {
        setLinkState('ready');
        setError(null);
        stripOAuthQueryParamsFromAddressBar();
        return;
      }

      if (pkceCode) {
        const first = await supabase.auth.exchangeCodeForSession(pkceCode);
        const { data: afterExchange } = await supabase.auth.getSession();
        if (cancelled) return;

        if (afterExchange.session) {
          setLinkState('ready');
          setError(null);
          stripOAuthQueryParamsFromAddressBar();
          return;
        }

        /** React Strict Mode runs this twice; second exchange fails — session may exist from first run. */
        const { data: retry } = await supabase.auth.getSession();
        if (!cancelled && retry.session) {
          setLinkState('ready');
          setError(null);
          stripOAuthQueryParamsFromAddressBar();
          return;
        }

        const msg =
          first.error?.message?.trim() ||
          'Invalid or expired reset link. Please request a new password reset.';
        if (!cancelled) {
          setLinkState('invalid');
          setError({ message: msg });
        }
        return;
      }

      /** Supabase may put tokens in the URL hash (#access_token=…&type=recovery). */
      const hash = window.location.hash.slice(1);
      const hashLooksLikeRecovery =
        hash.includes('access_token') ||
        hash.includes('type=recovery') ||
        hash.includes('refresh_token');

      const iterations = hashLooksLikeRecovery ? 150 : 70;
      for (let i = 0; i < iterations; i += 1) {
        const { data: poll } = await supabase.auth.getSession();
        if (cancelled) return;
        if (poll.session) {
          setLinkState('ready');
          setError(null);
          stripOAuthQueryParamsFromAddressBar();
          if (hashLooksLikeRecovery) {
            stripHashFromAddressBar();
          }
          return;
        }
        await sleep(100);
      }

      if (!cancelled) {
        setLinkState('invalid');
        setError({
          message:
            'Invalid or expired reset link. Please request a new password reset from the login page.',
        });
      }
    })();

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkState !== 'ready') {
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!passwordStrength?.isValid) {
        throw new Error('Password does not meet the requirements');
      }

      if (resolvedPrismaToken) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resolvedPrismaToken, password }),
        });
        const payload = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? 'Could not reset password');
        }
        toast.success(payload.message ?? 'Password updated');
        router.push('/login');
        return;
      }

      const supabase = supabaseClient ?? createBrowserClientOptional();
      if (!supabase) {
        throw new Error('Supabase client is not available.');
      }

      const { error: sbError } = await supabase.auth.updateUser({
        password: password,
      });

      if (sbError) throw sbError;

      toast.success('Password has been reset successfully');
      router.push('/login');
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const message =
        error instanceof Error ? error.message : 'Error resetting password';
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status: unknown }).status === 'number'
          ? (error as { status: number }).status
          : undefined;
      setError({
        message,
        status,
      });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {linkState === 'checking' && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center gap-2">
                <Icons.spinner className="h-4 w-4 shrink-0 animate-spin" />
                Checking your reset link…
              </AlertDescription>
            </Alert>
          )}
          {error && linkState === 'invalid' && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {linkState === 'ready' && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {linkState === 'ready' && (
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {passwordStrength && (
                    <div className="space-y-2">
                      <Progress value={(passwordStrength.score / 7) * 100} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {passwordStrength.feedback.map((msg, i) => (
                          <p key={i} className="text-red-500">
                            • {msg}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading || !passwordStrength?.isValid}>
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
