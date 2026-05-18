'use client';
import React from 'react';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { signIn } from 'next-auth/react';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Starter (Free Trial)',
  PRO: 'Pro',
  LIFETIME: 'Zen Access (Lifetime)',
  ZEN_PLUS: 'Zen+ Coaching',
  COACHING_SESSION: '1-on-1 Coaching Session',
};
const PLAN_PRICES: Record<string, string> = {
  FREE: '$6.99/mo after trial',
  PRO: '$14.99/mo or $139/yr',
  LIFETIME: '$249 one-time',
  ZEN_PLUS: '$49/mo or $499/yr',
  COACHING_SESSION: '$65/session',
};
const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['Basic budgeting tools', 'Community access', '14-day free trial'],
  PRO: ['All Starter features', 'Advanced analytics', 'Priority support', 'Bank sync'],
  LIFETIME: ['All Pro features', 'Lifetime access', 'Exclusive webinars', 'Priority support'],
  ZEN_PLUS: [
    'Exclusive coaching for Pro/Zen users',
    'Monthly expert review',
    'Accountability plan',
    'Priority support',
    'Coaching portal access',
  ],
  COACHING_SESSION: [
    '45-minute Zoom call',
    'Post-session action plan',
    'Financial health audit',
    'Pay-as-you-go option',
  ],
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Plan/cycle state
  const [plan, setPlan] = useState<string>('FREE');
  const [cycle, setCycle] = useState<string>('monthly');
  const [country, setCountry] = useState<string>('');
  const [state, setState] = useState<string>('');

  useEffect(() => {
    const planParam = searchParams.get('plan');
    const cycleParam = searchParams.get('cycle');
    if (planParam && PLAN_LABELS[planParam.toUpperCase()]) {
      setPlan(planParam.toUpperCase());
    }
    if (cycleParam && ['monthly', 'annual'].includes(cycleParam.toLowerCase())) {
      setCycle(cycleParam.toLowerCase());
    }
  }, [searchParams]);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setEmailError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password.length < 8) {
      setError(
        'Password is too weak. Use at least 8 characters, a number, an uppercase letter, and a symbol.'
      );
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          plan,
          cycle,
          country,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // If the response contains a URL, it's a Stripe Checkout session
      if (data.url) {
        router.push(data.url);
      } else {
        // Otherwise, it's a free plan, redirect to onboarding
        router.push('/onboarding');
      }

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="space-y-4 px-5 py-5 sm:space-y-5 sm:px-8 sm:py-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="h-11 w-full gap-2 border-input bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-900 dark:border-gray-200 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:hover:text-gray-900"
          >
            <Icons.google className="h-4 w-4" />
            Sign up with Google
          </Button>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className={`${shake ? 'animate-shake' : ''} space-y-4`}
            autoComplete="off"
          >
          {/* Plan summary card */}
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Selected Plan:</span> {PLAN_LABELS[plan]}
              </div>
              <a href="/pricing" className="text-sm text-primary underline-offset-4 hover:underline">
                Change plan
              </a>
            </div>
            <div className="text-lg font-bold">{PLAN_PRICES[plan]}</div>
            <ul className="ml-5 list-disc text-sm">
              {PLAN_FEATURES[plan].map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan === 'PRO' && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={cycle === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCycle('monthly')}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  variant={cycle === 'annual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCycle('annual')}
                >
                  Annual
                </Button>
              </div>
            )}
            {plan === 'ZEN_PLUS' && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={cycle === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCycle('monthly')}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  variant={cycle === 'annual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCycle('annual')}
                >
                  Annual
                </Button>
              </div>
            )}
          </div>
          <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
            Create your StackZen account
          </h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              disabled={isLoading}
              className="mt-2"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={isLoading}
              className="mt-2"
              autoComplete="email"
            />
            {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              type="text"
              required
              disabled={isLoading}
              className="mt-2"
              autoComplete="country"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              name="state"
              type="text"
              disabled={isLoading}
              className="mt-2"
              autoComplete="address-level1"
              value={state}
              onChange={e => setState(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              className="mt-2"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={isLoading}
              className="mt-2"
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={v => setAgreeToTerms(!!v)}
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <a href="/terms" className="underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>
            </Label>
          </div>
          {error && <div className="text-center text-sm text-red-500">{error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <RegisterPageContent />
    </Suspense>
  );
}
