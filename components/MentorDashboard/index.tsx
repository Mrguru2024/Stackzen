'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useViewAsSession } from '@/components/providers/ViewAsProvider';

interface MenteeSessionDto {
  lastSessionAt: string | null;
  nextSessionAt: string | null;
  totalSessions: number;
  status: 'active' | 'inactive';
}

interface MenteeDto {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  sessions: MenteeSessionDto;
}

interface MentorResourceDto {
  id: string;
  title: string;
  type: string;
  url: string | null;
  fileUrl: string | null;
  isPublic: boolean;
  downloads: number;
  sharedAt: string;
}

interface MentorReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: string | null;
  createdAt: string;
}

interface MentorDashboardDto {
  mentor: { id: string; name: string; isCertified: boolean; isActive: boolean } | null;
  mentees: MenteeDto[];
  resources: MentorResourceDto[];
  recentReviews: MentorReviewDto[];
  totals: {
    activeMentees: number;
    totalSessions: number;
    upcomingSessions: number;
    averageRating: number;
  };
  generatedAt: string;
}

const initialFor = (name: string | null) => (name && name.length > 0 ? name[0]!.toUpperCase() : '?');
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

export default function MentorDashboard() {
  const viewAsSession: any = useViewAsSession();
  const role = (viewAsSession?.data?.user?.role ?? '').toString().toUpperCase();
  const isMentor = role === 'MENTOR';

  const query = useQuery<MentorDashboardDto, Error>({
    queryKey: ['mentor', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/mentor/dashboard', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load mentor dashboard (${res.status})`);
      }
      return res.json();
    },
    enabled: isMentor,
    staleTime: 60_000,
  });

  if (!isMentor) {
    return null;
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">{query.error.message}</CardContent>
      </Card>
    );
  }

  const data = query.data;
  if (!data || !data.mentor) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don&apos;t have a mentor profile yet. Visit settings to apply for mentor status before
          managing mentees.
        </CardContent>
      </Card>
    );
  }

  const { mentees, resources, recentReviews, totals } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Active mentees</p>
              <p className="text-2xl font-bold">{totals.activeMentees}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Upcoming sessions</p>
              <p className="text-2xl font-bold">{totals.upcomingSessions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total sessions</p>
              <p className="text-2xl font-bold">{totals.totalSessions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average rating</p>
              <p className="text-2xl font-bold">{totals.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Mentees</CardTitle>
        </CardHeader>
        <CardContent>
          {mentees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mentees have booked sessions with you yet.
            </p>
          ) : (
            <div className="space-y-4">
              {mentees.map(mentee => (
                <div key={mentee.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar>
                      {mentee.image ? <AvatarImage src={mentee.image} /> : null}
                      <AvatarFallback>{initialFor(mentee.name ?? mentee.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        {mentee.name ?? mentee.email ?? 'Mentee'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {mentee.sessions.nextSessionAt
                          ? `Next session: ${formatDate(mentee.sessions.nextSessionAt)}`
                          : `Last session: ${formatDate(mentee.sessions.lastSessionAt)}`}
                      </p>
                    </div>
                    <Badge
                      variant={mentee.sessions.status === 'active' ? 'success' : 'secondary'}
                      className="ml-auto"
                    >
                      {mentee.sessions.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{mentee.sessions.totalSessions} session(s)</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm">Send Message</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources Shared</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t shared any resources with your mentees yet.
            </p>
          ) : (
            <div className="space-y-3">
              {resources.map(resource => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Shared {formatDate(resource.sharedAt)} · {resource.downloads} downloads
                    </p>
                  </div>
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="mt-3 w-full">
            Share New Resource
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet from your mentees.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map(review => (
                <div
                  key={review.id}
                  className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.reviewer ?? 'Anonymous mentee'}</p>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {review.rating} / 5
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="mt-1 text-sm text-foreground/80">{review.comment}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
