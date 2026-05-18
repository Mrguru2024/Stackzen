import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import MentorApplicationForm from '@/components/mentors/MentorApplicationForm';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Become a Mentor - StackZen',
  description:
    'Apply to become a vetted financial mentor and help others achieve their financial goals.',
};

export default async function BecomeMentorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/become-mentor');
  }

  const existing = await prisma.mentor.findUnique({
    where: { userId: session.user.id },
    select: { applicationStatus: true },
  });

  if (existing && existing.applicationStatus !== 'REJECTED') {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-bold">You already have a mentor application</h1>
        <p className="text-muted-foreground">
          Track vetting status, upload documents, or finish setup from your mentor hub.
        </p>
        <Button asChild>
          <Link href="/mentor-portal/dashboard">Open mentor portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Become a StackZen mentor</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Apply with proof of credentials. After vetting and setup, you&apos;ll appear in our directory
          for members seeking financial guidance.
        </p>
        <ol className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 text-sm text-muted-foreground">
          <li className="rounded-full border px-3 py-1">1. Apply</li>
          <li className="rounded-full border px-3 py-1">2. Upload documents</li>
          <li className="rounded-full border px-3 py-1">3. Admin review</li>
          <li className="rounded-full border px-3 py-1">4. Go live</li>
        </ol>
      </header>
      <MentorApplicationForm />
    </div>
  );
}
