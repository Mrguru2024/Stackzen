import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { MentorPortalApp } from '@/components/mentor-portal/MentorPortalApp';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Mentor Portal | StackZen',
  description: 'Manage mentoring sessions, income, messaging, and client insights.',
};

export default async function MentorPortalDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/mentor-portal/login');
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <MentorPortalApp />
    </Suspense>
  );
}
