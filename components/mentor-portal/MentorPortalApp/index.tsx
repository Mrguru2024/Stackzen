'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MentorHub } from '@/components/mentors/MentorHub';
import { MentorStripeConnectCard } from '@/components/mentors/MentorStripeConnectCard';
import {
  MentorMessagingPanel,
  type MentorMessagingApiBase,
} from '@/components/mentors/MentorMessagingPanel';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Lock,
  MessageSquare,
  Shield,
  Users,
  Video,
  Loader2,
} from 'lucide-react';

type PortalTab = 'overview' | 'analytics' | 'billing' | 'sessions' | 'messages' | 'clients';

const mentorMessagingApi: MentorMessagingApiBase = {
  conversations: '/api/mentor-portal/conversations',
  messages: id => `/api/mentor-portal/conversations/${id}/messages`,
  stream: id => `/api/mentor-portal/conversations/${id}/stream`,
};

export function MentorPortalApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const initialTab = (searchParams.get('tab') as PortalTab) || 'overview';
  const [tab, setTab] = useState<PortalTab>(initialTab);

  const overview = useQuery({
    queryKey: ['mentor-portal', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/mentor-portal/overview', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load portal');
      return res.json();
    },
  });

  const analytics = useQuery({
    queryKey: ['mentor-portal', 'analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/mentor-personal?timeRange=90d', { cache: 'no-store' });
      if (!res.ok) throw new Error('Analytics unavailable');
      return res.json();
    },
    enabled: tab === 'analytics' && overview.data?.mentor?.canViewClientData,
  });

  const billing = useQuery({
    queryKey: ['mentor-portal', 'billing'],
    queryFn: async () => {
      const res = await fetch('/api/mentor-portal/billing', { cache: 'no-store' });
      if (!res.ok) throw new Error('Billing unavailable');
      return res.json();
    },
    enabled: tab === 'billing',
  });

  const sessions = useQuery({
    queryKey: ['mentor-portal', 'sessions'],
    queryFn: async () => {
      const res = await fetch('/api/mentor-portal/sessions', { cache: 'no-store' });
      if (!res.ok) throw new Error('Sessions unavailable');
      return res.json();
    },
    enabled: tab === 'sessions' && overview.data?.mentor?.canViewClientData,
  });

  const clients = useQuery({
    queryKey: ['mentor-portal', 'clients'],
    queryFn: async () => {
      const res = await fetch('/api/mentor-portal/clients', { cache: 'no-store' });
      if (!res.ok) throw new Error('Clients unavailable');
      return res.json();
    },
    enabled: tab === 'clients' && overview.data?.mentor?.canViewClientData,
  });

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientActivity, setClientActivity] = useState<{
    activityLog: Array<{ id: string; kind: string; label: string; at: string; detail: string }>;
    dataPolicy: string;
  } | null>(null);

  const onTabChange = (value: string) => {
    const next = value as PortalTab;
    setTab(next);
    router.replace(`/mentor-portal/dashboard?tab=${next}`, { scroll: false });
  };

  const joinSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/mentor-portal/sessions/${sessionId}/room`, { method: 'POST' });
      const data = (await res.json()) as { roomUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not start session');
      if (data.roomUrl) window.open(data.roomUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({
        title: 'Session unavailable',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    }
  };

  const loadClientActivity = useCallback(async (userId: string) => {
    setSelectedClientId(userId);
    setClientActivity(null);
    try {
      const res = await fetch(`/api/mentor-portal/clients/${userId}/activity`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Access denied');
      setClientActivity(data);
    } catch (error) {
      toast({
        title: 'Cannot load activity',
        description: error instanceof Error ? error.message : 'Restricted',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (overview.isError) {
      toast({ title: 'Sign in as a mentor to continue', variant: 'destructive' });
    }
  }, [overview.isError, toast]);

  if (overview.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">You need a mentor account to access this portal.</p>
          <Button asChild>
            <Link href="/become-mentor">Apply to become a mentor</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { mentor, stats } = overview.data;
  const vetted = mentor.canViewClientData;

  if (!vetted && tab !== 'overview') {
    return (
      <div className="space-y-6">
        <MentorHub />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mentor portal</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {mentor.name} · {mentor.applicationStatusLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={vetted ? 'default' : 'secondary'}>
            {vetted ? 'Vetted — full access' : 'Limited — complete setup'}
          </Badge>
          {mentor.isCertified ? <Badge variant="outline">Certified</Badge> : null}
        </div>
      </div>

      {!vetted ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Client data & live tools locked
            </CardTitle>
            <CardDescription>
              Messaging, client activity logs, and live sessions unlock after admin approval and
              completing setup. Member privacy is protected until you are fully vetted.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!vetted}>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="billing">Income</TabsTrigger>
          <TabsTrigger value="sessions" disabled={!vetted}>
            Live sessions
          </TabsTrigger>
          <TabsTrigger value="messages" disabled={!vetted}>
            Messages
          </TabsTrigger>
          <TabsTrigger value="clients" disabled={!vetted}>
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {!vetted ? <MentorHub /> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold">
                <Calendar className="h-5 w-5 text-primary" />
                {stats.upcomingSessions}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unread messages
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold">
                <MessageSquare className="h-5 w-5 text-primary" />
                {stats.unreadMessages}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold">
                <DollarSign className="h-5 w-5 text-primary" />
                ${stats.totalEarnings}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Privacy & data policy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-inside list-disc space-y-1">
                <li>Client activity is read-only in the portal — no downloads or exports.</li>
                <li>Unvetted mentors cannot access member financial signals or messaging.</li>
                <li>Insights are limited to members with an active mentoring relationship.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : analytics.data ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Session revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${analytics.data.revenue ?? 0}</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.data.sessionCount ?? 0} sessions · Avg rating{' '}
                    {analytics.data.averageRating ?? '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(analytics.data.monthlySessions ?? []).slice(-6).map(
                    (m: { month: string; sessions: number; revenue: number }) => (
                      <div key={m.month} className="flex justify-between border-b py-1">
                        <span>{m.month}</span>
                        <span>
                          {m.sessions} sessions · ${m.revenue}
                        </span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <MentorStripeConnectCard />
          {billing.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : billing.data ? (
            <Card>
              <CardHeader>
                <CardTitle>Income & billing</CardTitle>
                <CardDescription>
                  Read-only ledger. Earned ${billing.data.totals.earned} · Pending $
                  {billing.data.totals.pending}. Export is disabled for member protection.
                  {billing.data.payouts?.message ? (
                    <span className="mt-2 block">{billing.data.payouts.message}</span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {billing.data.ledger.map(
                  (row: {
                    id: string;
                    scheduledAt: string;
                    memberName: string;
                    mentorPayout: number;
                    status: string;
                  }) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <span>
                        {row.memberName} · {new Date(row.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="font-medium">${row.mentorPayout}</span>
                      <Badge variant="outline">{row.status}</Badge>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="sessions">
          {sessions.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-3">
              {(sessions.data?.sessions ?? []).map(
                (s: {
                  id: string;
                  member: { id: string; name: string | null };
                  scheduledAt: string;
                  status: string;
                  sessionType: string;
                  meetingUrl: string | null;
                }) => (
                  <Card key={s.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium">{s.member.name ?? 'Member'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.scheduledAt).toLocaleString()} · {s.sessionType} ·{' '}
                          {s.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void joinSession(s.id)}>
                          <Video className="mr-2 h-4 w-4" />
                          {s.meetingUrl ? 'Join video' : 'Start video room'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const res = await fetch('/api/mentor-portal/conversations', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ memberUserId: s.member.id }),
                            });
                            const data = (await res.json()) as { conversationId?: string };
                            if (data.conversationId) {
                              setActiveConvoId(data.conversationId);
                              onTabChange('messages');
                            }
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

                <TabsContent value="messages">
          <MentorMessagingPanel
            api={mentorMessagingApi}
            peerLabel="Member"
            enabled={tab === 'messages' && overview.data?.mentor?.canViewClientData}
            initialConversationId={activeConvoId}
          />
        </TabsContent>

<TabsContent value="clients">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your clients
                </CardTitle>
                <CardDescription>{clients.data?.privacyNotice}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(clients.data?.clients ?? []).map(
                  (c: {
                    id: string;
                    name: string | null;
                    totalSessions: number;
                    lastSessionAt: string;
                  }) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`w-full rounded-md border p-3 text-left text-sm hover:bg-muted ${
                        selectedClientId === c.id ? 'border-primary' : ''
                      }`}
                      onClick={() => void loadClientActivity(c.id)}
                    >
                      <p className="font-medium">{c.name ?? 'Member'}</p>
                      <p className="text-muted-foreground">
                        {c.totalSessions} sessions · Last{' '}
                        {new Date(c.lastSessionAt).toLocaleDateString()}
                      </p>
                    </button>
                  )
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Activity log (read-only)</CardTitle>
                <CardDescription>
                  Summarized signals only — no export. Select a client to view.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 space-y-2 overflow-y-auto text-sm">
                {!selectedClientId ? (
                  <p className="text-muted-foreground">Select a client to view activity.</p>
                ) : !clientActivity ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  clientActivity.activityLog.map(entry => (
                    <div key={entry.id} className="rounded-md border p-2">
                      <p className="font-medium">{entry.label}</p>
                      <p className="text-muted-foreground">
                        {new Date(entry.at).toLocaleString()} · {entry.detail}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
