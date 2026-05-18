'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, FileWarning, GraduationCap } from 'lucide-react';
import { MentorOnboardingWizard } from '../MentorOnboardingWizard';
import { MentorDashboardWorkspace } from '../MentorDashboardWorkspace';
import { MentorDocumentUpload } from '../MentorDocumentUpload';

interface MentorMe {
  id: string;
  name: string;
  applicationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'SETUP_COMPLETE' | 'REJECTED';
  documentsComplete: boolean;
  listedForBooking: boolean;
  rejectionReason: string | null;
  isCertified: boolean;
}

async function fetchMentorMe(): Promise<MentorMe | null> {
  const res = await fetch('/api/mentors/me', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load mentor profile');
  const data = (await res.json()) as { mentor: MentorMe | null };
  return data.mentor;
}

export function MentorHub() {
  const { data: mentor, isLoading, error, refetch } = useQuery({
    queryKey: ['mentor', 'me'],
    queryFn: fetchMentorMe,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Could not load your mentor profile. Please refresh.
        </CardContent>
      </Card>
    );
  }

  if (!mentor) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Become a StackZen mentor
          </CardTitle>
          <CardDescription>
            Share your financial expertise, get vetted by our team, and help members reach their goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/become-mentor">Start application</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/mentors">Browse mentor directory</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mentor.applicationStatus === 'REJECTED') {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Application not approved
          </CardTitle>
          <CardDescription>
            {mentor.rejectionReason ??
              'Your application did not meet our vetting requirements. You may update documents and re-apply.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/become-mentor">Submit a new application</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mentor.applicationStatus === 'PENDING_REVIEW') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Application under review
            </CardTitle>
            <CardDescription>
              Our team is verifying your credentials and documentation. This usually takes 2–5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={mentor.documentsComplete ? 'default' : 'secondary'}>
                {mentor.documentsComplete ? 'Documents submitted' : 'Documents incomplete'}
              </Badge>
              <Badge variant="outline">Pending approval</Badge>
            </div>
            {!mentor.documentsComplete ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p>Upload the documents below so our team can complete vetting.</p>
                </div>
                <MentorDocumentUpload kind="headshot" mode="mentor" onUploaded={() => void refetch()} />
                <MentorDocumentUpload kind="license" mode="mentor" onUploaded={() => void refetch()} />
                <MentorDocumentUpload kind="id" mode="mentor" onUploaded={() => void refetch()} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mentor.applicationStatus === 'APPROVED') {
    return (
      <div className="space-y-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              You&apos;re approved — finish setup
            </CardTitle>
            <CardDescription>
              Complete the short setup below to appear in the mentor directory and accept bookings.
            </CardDescription>
          </CardHeader>
        </Card>
        <MentorOnboardingWizard onComplete={() => void refetch()} />
      </div>
    );
  }

  return <MentorDashboardWorkspace mentor={mentor} />;
}
