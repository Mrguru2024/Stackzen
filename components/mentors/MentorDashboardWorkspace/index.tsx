'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Star, Users } from 'lucide-react';

interface MentorSummary {
  id: string;
  name: string;
  isCertified: boolean;
  listedForBooking: boolean;
}

interface MentorDashboardDto {
  mentor: { id: string; name: string; isCertified: boolean; isActive: boolean } | null;
  mentees: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    sessions: { totalSessions: number; nextSessionAt: string | null; status: string };
  }>;
  recentReviews: Array<{ id: string; rating: number; comment: string | null; reviewer: string | null }>;
  totals: {
    activeMentees: number;
    totalSessions: number;
    upcomingSessions: number;
    averageRating: number;
  };
}

const initialFor = (name: string | null) => (name?.[0]?.toUpperCase() ?? '?');

export function MentorDashboardWorkspace({ mentor }: { mentor: MentorSummary }) {
  const query = useQuery<MentorDashboardDto>({
    queryKey: ['mentor', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/mentor/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load dashboard');
      return res.json();
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : 'Dashboard unavailable'}
        </CardContent>
      </Card>
    );
  }

  const { totals, mentees, recentReviews } = query.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Welcome back, {mentor.name}</h2>
          <p className="text-sm text-muted-foreground">Manage sessions and mentee relationships</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mentor.isCertified ? <Badge>StackZen Certified</Badge> : null}
          {mentor.listedForBooking ? (
            <Badge variant="default">Live in directory</Badge>
          ) : (
            <Badge variant="secondary">Not listed</Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/mentors">View public profile</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming sessions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="h-5 w-5 text-primary" />
            {totals.upcomingSessions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active mentees</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-5 w-5 text-primary" />
            {totals.activeMentees}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average rating</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Star className="h-5 w-5 text-amber-500" />
            {totals.averageRating.toFixed(1)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mentees</CardTitle>
        </CardHeader>
        <CardContent>
          {mentees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mentees yet. When members book sessions, they will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {mentees.slice(0, 8).map(m => (
                <li key={m.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.image ?? undefined} />
                    <AvatarFallback>{initialFor(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.name ?? m.email ?? 'Member'}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.sessions.totalSessions} sessions
                      {m.sessions.nextSessionAt
                        ? ` · Next ${new Date(m.sessions.nextSessionAt).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <Badge variant={m.sessions.status === 'active' ? 'default' : 'secondary'}>
                    {m.sessions.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {recentReviews.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReviews.map(r => (
              <div key={r.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {r.rating}/5 · {r.reviewer ?? 'Anonymous'}
                </div>
                {r.comment ? <p className="text-muted-foreground">{r.comment}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
