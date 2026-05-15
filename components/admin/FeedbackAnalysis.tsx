import React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';

interface FeedbackStats {
  totalFeedback: number;
  averageTimeSpent: string;
  featureUsage: Record<string, number>;
  performance: {
    pageLoadTimes: Record<string, number>;
    responseTimes: Record<string, number>;
    lagIssues: number;
  };
  deviceBreakdown: Record<string, number>;
}

interface FeedbackAnalysisProps {
  stats: FeedbackStats;
}

export function FeedbackAnalysis({ stats }: FeedbackAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              Average time spent: {stats.averageTimeSpent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance.lagIssues}</div>
            <p className="text-xs text-muted-foreground">Reported lag/freezing issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.featureUsage).sort((a, b) => b[1] - a[1])[0]?.[0]}
            </div>
            <p className="text-xs text-muted-foreground">Based on user feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.deviceBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0]}
            </div>
            <p className="text-xs text-muted-foreground">Most common platform</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="devices">Device Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {Object.entries(stats.featureUsage).map(([feature, count]) => (
                  <div key={feature} className="mb-4">
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-medium">{feature}</span>
                      <span className="text-sm text-muted-foreground">{count} users</span>
                    </div>
                    <Progress value={(count / stats.totalFeedback) * 100} className="h-2" />
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(stats.featureUsage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feature, count]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span>{feature}</span>
                      <Badge variant="secondary">
                        {Math.round((count / stats.totalFeedback) * 100)}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Page Load Times</h3>
                  <div className="grid gap-2">
                    {Object.entries(stats.performance.pageLoadTimes).map(([speed, count]) => (
                      <div key={speed} className="flex items-center justify-between">
                        <span>{speed}</span>
                        <Badge variant="secondary">{count} reports</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Response Times</h3>
                  <div className="grid gap-2">
                    {Object.entries(stats.performance.responseTimes).map(([speed, count]) => (
                      <div key={speed} className="flex items-center justify-between">
                        <span>{speed}</span>
                        <Badge variant="secondary">{count} reports</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(stats.deviceBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span>{device}</span>
                      <Badge variant="secondary">
                        {Math.round((count / stats.totalFeedback) * 100)}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
