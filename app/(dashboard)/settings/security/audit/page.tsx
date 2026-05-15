'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  SecurityAudit,
  type SecurityEvent,
  type SecurityEventType,
  type SecurityEventSeverity,
} from '@/lib/auth/security-audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/ui';

export default function SecurityAuditPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    recentThreats: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: 'all' as SecurityEventType | 'all',
    severity: 'all' as SecurityEventSeverity | 'all',
    limit: 50,
    offset: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [filters]);

  const loadEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const events = await SecurityAudit.getEvents(user.id, {
        eventTypes: filters.eventType === 'all' ? undefined : [filters.eventType],
        severity: filters.severity === 'all' ? undefined : [filters.severity],
        limit: filters.limit,
        offset: filters.offset,
      });

      setEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const stats = await SecurityAudit.getEventStats(user.id);
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getSeverityBadge = (severity: SecurityEventSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getEventTypeBadge = (type: SecurityEventType) => {
    const colors: Record<SecurityEventType, string> = {
      login_attempt: 'default',
      login_success: 'success',
      login_failure: 'destructive',
      password_change: 'warning',
      '2fa_enable': 'success',
      '2fa_disable': 'warning',
      device_added: 'info',
      device_removed: 'warning',
      location_blocked: 'destructive',
      suspicious_activity: 'destructive',
      security_settings_changed: 'info',
      vpn_detected: 'warning',
      proxy_detected: 'warning',
      tor_detected: 'warning',
      threat_detected: 'destructive',
    };

    return (
      <Badge variant={colors[type] as any}>
        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Audit Log</h3>
        <p className="text-sm text-muted-foreground">
          Monitor security events and track suspicious activities
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Icons.activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Threats</CardTitle>
              <Icons.alertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentThreats}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <Icons.alertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsBySeverity.critical || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <Icons.lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsByType.login_failure || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>Detailed view of security events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4">
            <Select
              value={filters.eventType}
              onValueChange={(value: SecurityEventType | 'all') =>
                setFilters({ ...filters, eventType: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="login_attempt">Login Attempts</SelectItem>
                <SelectItem value="login_success">Successful Logins</SelectItem>
                <SelectItem value="login_failure">Failed Logins</SelectItem>
                <SelectItem value="password_change">Password Changes</SelectItem>
                <SelectItem value="2fa_enable">2FA Enabled</SelectItem>
                <SelectItem value="2fa_disable">2FA Disabled</SelectItem>
                <SelectItem value="device_added">Device Added</SelectItem>
                <SelectItem value="device_removed">Device Removed</SelectItem>
                <SelectItem value="location_blocked">Location Blocked</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="security_settings_changed">Settings Changed</SelectItem>
                <SelectItem value="threat_detected">Threats Detected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.severity}
              onValueChange={(value: SecurityEventSeverity | 'all') =>
                setFilters({ ...filters, severity: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell>
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                  <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                  <TableCell>
                    {event.location ? (
                      <div>
                        {event.location.city}, {event.location.country}
                        {event.location.isp && (
                          <div className="text-sm text-muted-foreground">{event.location.isp}</div>
                        )}
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </TableCell>
                  <TableCell>
                    {event.device_info ? (
                      <div>
                        {event.device_info.type}
                        <div className="text-sm text-muted-foreground">
                          {event.device_info.browser}
                        </div>
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs">{JSON.stringify(event.details, null, 2)}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  ...filters,
                  offset: Math.max(0, filters.offset - filters.limit),
                })
              }
              disabled={filters.offset === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  ...filters,
                  offset: filters.offset + filters.limit,
                })
              }
              disabled={events.length < filters.limit}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
