'use client';

import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface Resolution {
  id: string;
  anomalyId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  assignedTo: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionTime?: number;
}

interface ResolutionStatsProps {
  resolutions: Resolution[];
  timeWindow: '1h' | '6h' | '24h' | '7d';
}

const _COLORS = {
  open: '#F59E0B',
  in_progress: '#3B82F6',
  resolved: '#10B981',
  ignored: '#6B7280',
};

export function ResolutionStats({ resolutions, timeWindow }: ResolutionStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const startTime = subDays(
      now,
      timeWindow === '1h' ? 1 / 24 : timeWindow === '6h' ? 6 / 24 : timeWindow === '24h' ? 1 : 7
    );

    const filteredResolutions = resolutions.filter(r => r.createdAt >= startTime);

    // Time series data for resolution trends
    const timeSeriesData = Array.from({ length: timeWindow === '7d' ? 7 : 24 }, (_, i) => {
      const time = subDays(
        now,
        timeWindow === '1h'
          ? i / 24
          : timeWindow === '6h'
            ? i / 4
            : timeWindow === '24h'
              ? i / 24
              : i
      );
      return {
        time: format(time, 'MMM dd HH:mm'),
        resolved: filteredResolutions.filter(
          r => r.status === 'resolved' && r.updatedAt >= time && r.updatedAt < subDays(time, -1)
        ).length,
        open: filteredResolutions.filter(
          r => r.status === 'open' && r.createdAt >= time && r.createdAt < subDays(time, -1)
        ).length,
      };
    }).reverse();

    // Status distribution
    const statusDistribution = Object.entries(
      filteredResolutions.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
    }));

    // Resolution time distribution
    const resolutionTimeData = filteredResolutions
      .filter(r => r.resolutionTime)
      .map(r => ({
        name: r.assignedTo,
        time: r.resolutionTime,
      }))
      .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
      .slice(0, 5);

    // Average resolution time
    const avgResolutionTime =
      filteredResolutions.reduce((acc, r) => acc + (r.resolutionTime || 0), 0) /
        filteredResolutions.filter(r => r.resolutionTime).length || 0;

    return {
      timeSeriesData,
      statusDistribution,
      resolutionTimeData,
      avgResolutionTime,
      totalResolutions: filteredResolutions.length,
      resolvedCount: filteredResolutions.filter(r => r.status === 'resolved').length,
    };
  }, [resolutions, timeWindow]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Resolutions</h3>
          <p className="text-2xl font-bold">{stats.totalResolutions}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Resolved Issues</h3>
          <p className="text-2xl font-bold">{stats.resolvedCount}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</h3>
          <p className="text-2xl font-bold">{Math.round(stats.avgResolutionTime)}m</p>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Resolution Trends</TabsTrigger>
          <TabsTrigger value="distribution">Status Distribution</TabsTrigger>
          <TabsTrigger value="time">Resolution Time</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="resolved" stroke="#10B981" name="Resolved" />
                  <Line type="monotone" dataKey="open" stroke="#F59E0B" name="Open" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={_COLORS[entry.name.replace(' ', '_') as keyof typeof _COLORS]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.resolutionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="time" fill="#3B82F6" name="Resolution Time (minutes)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
