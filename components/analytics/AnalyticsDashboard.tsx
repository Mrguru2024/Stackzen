'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  Shield,
} from 'lucide-react';

export type TimeRangeKey = '7d' | '30d' | '90d' | '1y';

interface PersonalAnalytics {
  timeRange: TimeRangeKey;
  totalIncome: number;
  incomeGrowthPct: number;
  completedBookings: number;
  bookingsGrowthPct: number;
  pendingInvoices: number;
  activeClients: number;
  monthlyIncome: Array<{ monthKey: string; month: string; income: number }>;
}

interface MentorPersonalAnalytics {
  profileSpecialties: string[];
  totalSessions: number;
  totalRevenue: number;
  averageRating: number;
  revenueGrowthPct: number;
  monthlySessions: Array<{ monthKey: string; month: string; sessions: number; revenue: number }>;
  topSpecialties: Array<{ name: string; count: number }>;
  mentorPerformance: Array<{ name: string; sessions: number; rating: number; revenue: number }>;
}

interface PlatformAnalytics {
  totalSessions: number;
  totalRevenue: number;
  averageRating: number;
  activeMentors: number;
  pendingApplications: number;
  sessionGrowth: number;
  revenueGrowth: number;
  monthlySessions: Array<{ monthKey: string; month: string; sessions: number; revenue: number }>;
  topSpecialties: Array<{ name: string; count: number }>;
  mentorPerformance: Array<{ name: string; sessions: number; rating: number; revenue: number }>;
}

interface AnalyticsDashboardProps {
  timeRange: TimeRangeKey;
}

function GrowthBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <span className="text-sm text-muted-foreground">No prior-period change</span>;
  }
  const up = pct > 0;
  return (
    <div className="mt-2 flex items-center gap-1">
      {up ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-amber-600" />
      )}
      <span className={`text-sm ${up ? 'text-green-600' : 'text-amber-700'}`}>
        {up ? '+' : ''}
        {pct}% vs prior period
      </span>
    </div>
  );
}

export default function AnalyticsDashboard({ timeRange }: AnalyticsDashboardProps) {
  const { data: session, status } = useSession();
  const [personal, setPersonal] = useState<PersonalAnalytics | null>(null);
  const [mentor, setMentor] = useState<MentorPersonalAnalytics | null>(null);
  const [platform, setPlatform] = useState<PlatformAnalytics | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const q = new URLSearchParams({ timeRange });
    try {
      const personalRes = await fetch(`/api/analytics/personal?${q}`, { credentials: 'same-origin' });
      if (!personalRes.ok) {
        throw new Error('Could not load your analytics');
      }
      setPersonal((await personalRes.json()) as PersonalAnalytics);

      const [mentorRes, platformRes] = await Promise.all([
        fetch(`/api/analytics/mentor-personal?${q}`, { credentials: 'same-origin' }),
        isAdmin ? fetch(`/api/analytics?${q}`, { credentials: 'same-origin' }) : Promise.resolve(null),
      ]);

      if (mentorRes.status === 403) {
        setMentor(null);
      } else if (mentorRes.ok) {
        setMentor((await mentorRes.json()) as MentorPersonalAnalytics);
      } else {
        setMentor(null);
      }

      if (isAdmin && platformRes && platformRes instanceof Response) {
        if (platformRes.status === 403) {
          setPlatform(null);
        } else if (platformRes.ok) {
          setPlatform((await platformRes.json()) as PlatformAnalytics);
        } else {
          setPlatform(null);
        }
      } else {
        setPlatform(null);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load analytics');
      setPersonal(null);
      setMentor(null);
      setPlatform(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange, isAdmin]);

  useEffect(() => {
    if (status === 'loading') return;
    void load();
  }, [load, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-4 py-8 text-center text-muted-foreground">Loading analytics…</div>
    );
  }

  if (loadError || !personal) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {loadError ?? 'Unable to load analytics.'}
        </CardContent>
      </Card>
    );
  }

  const showMentorTab = Boolean(mentor);
  const showAdminTab = isAdmin && Boolean(platform);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your income and workspace activity — scoped to your account.
            {showAdminTab ? ' Platform mentorship metrics are admin-only.' : ''}
          </p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="personal">Your finances</TabsTrigger>
          {showMentorTab ? <TabsTrigger value="mentorship">Your mentorship</TabsTrigger> : null}
          {showAdminTab ? (
            <TabsTrigger value="platform" className="gap-1">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Platform (admin)
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Income ({personal.timeRange})</p>
                    <p className="text-3xl font-bold">${personal.totalIncome.toLocaleString()}</p>
                    <GrowthBadge pct={personal.incomeGrowthPct} />
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed bookings</p>
                    <p className="text-3xl font-bold">{personal.completedBookings}</p>
                    <GrowthBadge pct={personal.bookingsGrowthPct} />
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending invoices</p>
                    <p className="text-3xl font-bold">{personal.pendingInvoices}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Open, sent, or overdue</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active clients</p>
                    <p className="text-3xl font-bold">{personal.activeClients}</p>
                    <p className="mt-2 text-xs text-muted-foreground">With invoices or jobs in period</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                Income by month (this range)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personal.monthlyIncome.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded income in this window yet.</p>
              ) : (
                <div className="space-y-3">
                  {personal.monthlyIncome.map(row => (
                    <div key={row.monthKey} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.month}</span>
                      <span className="text-green-600 dark:text-green-400">
                        ${row.income.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Totals combine completed service bookings, manual income entries, and bank inflows tagged as income
                (Plaid).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {showMentorTab && mentor ? (
          <TabsContent value="mentorship" className="space-y-6">
            {mentor.profileSpecialties.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentor.profileSpecialties.map(s => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Sessions (confirmed / completed)</p>
                  <p className="text-3xl font-bold">{mentor.totalSessions}</p>
                  <Briefcase className="mt-2 h-6 w-6 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Session revenue</p>
                  <p className="text-3xl font-bold">${mentor.totalRevenue.toLocaleString()}</p>
                  <GrowthBadge pct={mentor.revenueGrowthPct} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Avg. session rating</p>
                  <p className="text-3xl font-bold">{mentor.averageRating}</p>
                  <Star className="mt-2 h-6 w-6 text-yellow-500" />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions & revenue by month</CardTitle>
              </CardHeader>
              <CardContent>
                {mentor.monthlySessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions in this range.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {mentor.monthlySessions.map(m => (
                      <div key={m.monthKey} className="flex justify-between">
                        <span>{m.month}</span>
                        <span>
                          {m.sessions} ses. · ${m.revenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {showAdminTab && platform ? (
          <TabsContent value="platform" className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Cross-mentor platform metrics — visible only to administrators. Sourced from live mentorship
              sessions.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total sessions</p>
                  <p className="text-3xl font-bold">{platform.totalSessions.toLocaleString()}</p>
                  <GrowthBadge pct={platform.sessionGrowth} />
                  <Clock className="mt-2 h-6 w-6 text-blue-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Session revenue</p>
                  <p className="text-3xl font-bold">${platform.totalRevenue.toLocaleString()}</p>
                  <GrowthBadge pct={platform.revenueGrowth} />
                  <DollarSign className="mt-2 h-6 w-6 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Avg. rating</p>
                  <p className="text-3xl font-bold">{platform.averageRating}</p>
                  <Star className="mt-2 h-6 w-6 text-yellow-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Active mentors</p>
                  <p className="text-3xl font-bold">{platform.activeMentors}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {platform.pendingApplications} pending verification
                  </p>
                  <Users className="mt-2 h-6 w-6 text-purple-500" />
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="admin-overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="admin-overview">Overview</TabsTrigger>
                <TabsTrigger value="admin-mentors">Mentors</TabsTrigger>
                <TabsTrigger value="admin-specialties">Specialties</TabsTrigger>
                <TabsTrigger value="admin-trends">Trends</TabsTrigger>
              </TabsList>
              <TabsContent value="admin-overview" className="space-y-4">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-5 w-5" />
                        Sessions by month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {platform.monthlySessions.map(item => (
                          <div key={item.monthKey} className="flex justify-between">
                            <span>{item.month}</span>
                            <span>
                              {item.sessions} · ${item.revenue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PieChart className="h-5 w-5" />
                        Specialty tags (session-weighted)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {platform.topSpecialties.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tagged sessions in range.</p>
                      ) : (
                        <div className="space-y-2">
                          {platform.topSpecialties.map((s, i) => (
                            <div key={s.name} className="flex justify-between text-sm">
                              <span>
                                {i + 1}. {s.name}
                              </span>
                              <Badge variant="secondary">{s.count}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="admin-mentors">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentor revenue (period)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {platform.mentorPerformance.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No mentor activity in this range.</p>
                    ) : (
                      platform.mentorPerformance.map((m, i) => (
                        <div
                          key={`${m.name}-${i}`}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-muted-foreground">
                              {m.sessions} sessions · ★ {m.rating}
                            </p>
                          </div>
                          <p className="font-semibold">${m.revenue.toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="admin-specialties">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {platform.topSpecialties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data.</p>
                  ) : (
                    platform.topSpecialties.map(s => (
                      <Card key={s.name}>
                        <CardHeader>
                          <CardTitle className="text-base">{s.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Sessions attributed to this tag:{' '}
                            <span className="font-semibold text-foreground">{s.count}</span>
                          </p>
                          {platform.totalSessions > 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {((s.count / platform.totalSessions) * 100).toFixed(1)}% of period sessions
                              (multi-tag sessions count toward each listed specialty)
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="admin-trends">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Session count trend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {platform.monthlySessions.map((item, index) => {
                        const prev = index > 0 ? platform.monthlySessions[index - 1].sessions : item.sessions;
                        const growth = prev ? ((item.sessions - prev) / prev) * 100 : 0;
                        return (
                          <div key={item.monthKey} className="flex justify-between">
                            <span>{item.month}</span>
                            <span className={growth >= 0 ? 'text-green-600' : 'text-amber-700'}>
                              {item.sessions} ({growth >= 0 ? '+' : ''}
                              {growth.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Revenue trend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {platform.monthlySessions.map((item, index) => {
                        const prev = index > 0 ? platform.monthlySessions[index - 1].revenue : item.revenue;
                        const growth = prev ? ((item.revenue - prev) / prev) * 100 : 0;
                        return (
                          <div key={`r-${item.monthKey}`} className="flex justify-between">
                            <span>{item.month}</span>
                            <span className={growth >= 0 ? 'text-green-600' : 'text-amber-700'}>
                              ${item.revenue.toLocaleString()} ({growth >= 0 ? '+' : ''}
                              {growth.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

AnalyticsDashboard.displayName = 'AnalyticsDashboard';
