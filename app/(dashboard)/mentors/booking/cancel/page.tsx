'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

function BookingCancelContent() {
  const searchParams = useSearchParams();
  const mentorSessionId = searchParams.get('mentor_session_id');
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const retryCheckout = async () => {
    if (!mentorSessionId) {
      toast({ title: 'Session not found', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/mentors/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mentorSessionId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout unavailable');
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: 'Could not resume checkout',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-16">
      <Card>
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto mb-2 h-12 w-12 text-amber-500" />
          <CardTitle>Checkout cancelled</CardTitle>
          <CardDescription>
            Your session hold was created but payment was not completed. You can return to checkout
            anytime before the session time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {mentorSessionId ? (
            <Button onClick={() => void retryCheckout()} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Resume payment
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/financial-mentorship">Back to mentorship</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MentorBookingCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-muted-foreground">Loading…</div>
      }
    >
      <BookingCancelContent />
    </Suspense>
  );
}
