import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface SystemHealthProps {
  health: {
    database: string;
    redis: string;
    api: Array<{ endpoint: string; status: string }>;
    lastChecked: string;
  };
}

export function SystemHealth({ health }: SystemHealthProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'degraded':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 9v2" />
            <path d="M12 15h.01" />
            <path d="M5.07 19H19a2 2 0 0 0 1.75-2.67l-7.02-12a2 2 0 0 0-3.5 0l-7.02 12A2 2 0 0 0 5.07 19z" />
          </svg>
        );
      case 'unhealthy':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return null;
    }
  };

  const healthyEndpoints = health.api.filter(endpoint => endpoint.status === 'healthy').length;
  const healthPercentage = (healthyEndpoints / health.api.length) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database</CardTitle>
          {getStatusIcon(health.database)}
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(health.database)}>{health.database}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
          {getStatusIcon(health.redis)}
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(health.redis)}>{health.redis}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Health</CardTitle>
          {getStatusIcon(
            healthPercentage === 100 ? 'healthy' : healthPercentage > 50 ? 'degraded' : 'unhealthy'
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {healthyEndpoints} / {health.api.length} endpoints healthy
              </span>
              <span className="text-sm font-medium">{healthPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={healthPercentage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Check</CardTitle>
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
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(health.lastChecked))} ago
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
