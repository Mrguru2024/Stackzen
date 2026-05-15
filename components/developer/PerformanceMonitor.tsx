import React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { formatBytes, formatNumber } from '@/lib/utils';

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  network: {
    connections: number;
    bytesIn: number;
    bytesOut: number;
  };
  database: {
    connections: number;
    queryTime: number;
    queriesPerSecond: number;
  };
  redis: {
    memory: number;
    connectedClients: number;
    commandsProcessed: number;
  };
}

export function PerformanceMonitor() {
  const { subscribe } = useWebSocket();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('performance-metrics', data => {
      setMetrics(data);
    });

    return () => {
      unsubscribe?.();
    };
  }, [subscribe]);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* CPU Usage */}
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Overall Usage</span>
              <span>{metrics.cpu.usage.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.cpu.usage} />
            <div className="text-sm text-muted-foreground">
              <p>Cores: {metrics.cpu.cores}</p>
              <p>Load Average: {metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Usage</span>
              <span>{metrics.memory.usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.memory.usagePercentage} />
            <div className="text-sm text-muted-foreground">
              <p>Total: {formatBytes(metrics.memory.total)}</p>
              <p>Used: {formatBytes(metrics.memory.used)}</p>
              <p>Free: {formatBytes(metrics.memory.free)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Connections</span>
              <span>{metrics.network.connections}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Bytes In: {formatBytes(metrics.network.bytesIn)}</p>
              <p>Bytes Out: {formatBytes(metrics.network.bytesOut)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Connections</span>
              <span>{metrics.database.connections}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Query Time: {metrics.database.queryTime.toFixed(2)}ms</p>
              <p>Queries/sec: {formatNumber(metrics.database.queriesPerSecond)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redis Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Redis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Memory Usage</span>
              <span>{formatBytes(metrics.redis.memory)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Connected Clients: {metrics.redis.connectedClients}</p>
              <p>Commands Processed: {formatNumber(metrics.redis.commandsProcessed)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
