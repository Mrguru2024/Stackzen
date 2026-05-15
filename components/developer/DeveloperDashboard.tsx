'use client';

import React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { PerformanceMonitor } from '@/components/developer/PerformanceMonitor';
import { ApiTester } from '@/components/developer/ApiTester';

/** Serializable metrics passed from the server page into this client component. */
export interface DeveloperDashboardMetrics {
  totalErrors: number;
  recentErrors: Array<{
    id: string;
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  activeUsers: number;
  systemHealth: {
    database: boolean;
    redis: boolean;
    api: boolean;
  };
  recentDeployments: Array<{
    id: string;
    version: string;
    status: 'success' | 'failed' | 'in_progress';
    timestamp: string;
  }>;
}

interface DeveloperDashboardProps {
  metrics: DeveloperDashboardMetrics;
}

export function DeveloperDashboard({ metrics }: DeveloperDashboardProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const _handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/developer/refresh-metrics');
      if (!response.ok) throw new Error('Failed to refresh metrics');
      toast({
        title: 'Success',
        description: 'Metrics refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh metrics',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Developer Dashboard</h2>
        <Button onClick={_handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Badge variant={metrics.totalErrors > 0 ? 'destructive' : 'default'}>
              {metrics.totalErrors}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalErrors}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant={metrics.systemHealth.database ? 'default' : 'destructive'}>
                  {metrics.systemHealth.database ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis</span>
                <Badge variant={metrics.systemHealth.redis ? 'default' : 'destructive'}>
                  {metrics.systemHealth.redis ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API</span>
                <Badge variant={metrics.systemHealth.api ? 'default' : 'destructive'}>
                  {metrics.systemHealth.api ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[100px]">
              {metrics.recentDeployments.map(deployment => (
                <div key={deployment.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">v{deployment.version}</span>
                  <Badge
                    variant={
                      deployment.status === 'success'
                        ? 'default'
                        : deployment.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {deployment.status}
                  </Badge>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="api">API Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {metrics.recentErrors.map(error => (
                  <Alert key={error.id} className="mb-2">
                    <AlertTitle className="flex items-center justify-between">
                      <span>{error.message}</span>
                      <Badge
                        variant={
                          error.severity === 'high'
                            ? 'destructive'
                            : error.severity === 'medium'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {error.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiTester />
        </TabsContent>
      </Tabs>
    </div>
  );
}
