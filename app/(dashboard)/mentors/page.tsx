import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import MentorDirectory from '@/components/mentors/MentorDirectory';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'StackZen Mentors - Find Your Financial Coach',
  description: 'Connect with vetted financial mentors for personalized guidance and support.',
};

export default function MentorsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">StackZen financial mentors</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Browse vetted mentors, book a StackZen session ($65), or schedule direct time at their
          hourly rate. Every listed mentor has passed document and credential review.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/financial-mentorship">Financial mentorship</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/become-mentor">Apply to become a mentor</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/mentor-dashboard">Mentor hub</Link>
          </Button>
        </div>
      </div>

      <MentorDirectory />
    </div>
  );
}
