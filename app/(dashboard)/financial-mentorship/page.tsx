import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import MentorDirectory from '@/components/mentors/MentorDirectory';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Financial Mentorship | StackZen',
  description:
    'Book vetted financial mentors for one-on-one coaching. StackZen sessions and direct mentor bookings with secure Stripe checkout.',
};

export default function FinancialMentorshipPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Financial mentorship</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Work with verified mentors on budgeting, debt payoff, investing basics, and business
          finances. Book a session, pay securely at checkout, and meet live when your mentor
          confirms.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/mentors">Browse all mentors</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/become-mentor">Become a mentor</Link>
          </Button>
        </div>
      </div>

      <MentorDirectory />
    </div>
  );
}
