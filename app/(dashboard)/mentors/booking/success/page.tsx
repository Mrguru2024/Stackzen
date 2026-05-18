'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const checkoutSessionId = searchParams.get('session_id');

  return (
    <div className="container mx-auto max-w-lg py-16">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-500" />
          <CardTitle>Payment received</CardTitle>
          <CardDescription>
            Your mentorship session is confirmed. Your mentor will share meeting details before the
            scheduled time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checkoutSessionId ? (
            <p className="text-center text-xs text-muted-foreground">
              Reference: {checkoutSessionId.slice(0, 20)}…
            </p>
          ) : null}
          <Button asChild>
            <Link href="/financial-mentorship">Back to mentorship</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mentors">View mentors</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MentorBookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-muted-foreground">Loading…</div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
