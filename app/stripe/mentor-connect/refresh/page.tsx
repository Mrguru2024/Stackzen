'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Stripe redirects here when an onboarding link expires — mint a fresh link. */
export default function MentorStripeConnectRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mentors/connect/onboard', { method: 'POST' });
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        // fall through
      }
      router.push('/mentor-portal/dashboard?tab=billing');
    })();
  }, [router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Refreshing Stripe onboarding…</p>
    </div>
  );
}
