'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { DeviceManagement } from './DeviceManagement';
import { AuditLogs } from './AuditLogs';
import { SystemHealth } from './SystemHealth';
import { SecurityMetrics } from './SecurityMetrics';
import { UserActivity } from './UserActivity';
import { SuperAdminDiagnostics } from './SuperAdminDiagnostics';

interface AdminDashboardProps {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    blockedIPs: number;
    suspiciousIPs: number;
    recentLogins: Array<{ id: string; email: string | null; lastLogin: Date | null }>;
    recentErrors: Array<{ id: string; message: string; createdAt: Date }>;
    systemHealth: {
      database: string;
      redis: string;
      api: Array<{ endpoint: string; status: string; error?: string }>;
      lastChecked: string;
      error?: string;
    };
  };
}

export function AdminDashboard({ metrics, session }: AdminDashboardProps & { session?: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [errorLogs, setErrorLogs] = useState([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errorLogError, setErrorLogError] = useState<string | null>(null);
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (activeTab === 'error-log') {
      setLoadingErrors(true);
      fetch('/api/admin/error-logs')
        .then(res => res.json())
        .then(data => {
          setErrorLogs(data.logs || []);
          setLoadingErrors(false);
        })
        .catch(err => {
          setErrorLogError('Failed to load error logs');
          setLoadingErrors(false);
        });
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {isSuperAdmin && <SuperAdminDiagnostics isSuperAdmin={isSuperAdmin} />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">{metrics.suspiciousIPs} suspicious IPs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge
                variant={metrics.systemHealth.database === 'healthy' ? 'default' : 'destructive'}
              >
                DB
              </Badge>
              <Badge variant={metrics.systemHealth.redis === 'healthy' ? 'default' : 'destructive'}>
                Redis
              </Badge>
              <Badge
                variant={
                  metrics.systemHealth.api.every(endpoint => endpoint.status === 'healthy')
                    ? 'default'
                    : 'destructive'
                }
              >
                API
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Last checked {formatDistanceToNow(new Date(metrics.systemHealth.lastChecked))} ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentErrors.length}</div>
            <p className="text-xs text-muted-foreground">
              Last error {formatDistanceToNow(metrics.recentErrors[0]?.createdAt || new Date())}{' '}
              ago
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Device Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="error-log">Error Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SystemHealth health={metrics.systemHealth} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Logins</CardTitle>
                <CardDescription>Last 5 user logins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentLogins.map(login => (
                    <div key={login.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{login.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(login.lastLogin || new Date())} ago
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Last 5 system errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentErrors.map(error => (
                    <div key={error.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{error.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(error.createdAt)} ago
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="security">
          <SecurityMetrics blockedIPs={metrics.blockedIPs} suspiciousIPs={metrics.suspiciousIPs} />
        </TabsContent>

        <TabsContent value="users">
          <UserActivity totalUsers={metrics.totalUsers} activeUsers={metrics.activeUsers} />
        </TabsContent>

        <TabsContent value="error-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Error Log (last 15 days)</CardTitle>
              <CardDescription>Latest errors and site issues for review</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div>Loading error logs...</div>
              ) : errorLogError ? (
                <div className="text-destructive">{errorLogError}</div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Time</th>
                      <th className="text-left">User</th>
                      <th className="text-left">Message</th>
                      <th className="text-left">Stack (truncated)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td>{log.userEmail || 'N/A'}</td>
                        <td>{log.message}</td>
                        <td>{log.stack ? log.stack.slice(0, 60) + '...' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
