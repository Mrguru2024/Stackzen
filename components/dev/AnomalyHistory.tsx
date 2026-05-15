import React from 'react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui';
import { Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Anomaly } from './PerformanceAnomalies.tsx';

interface AnomalyHistoryProps {
  anomalies: Anomaly[];
  onExport?: (anomalies: Anomaly[]) => void;
}

export function AnomalyHistory({ anomalies, onExport }: AnomalyHistoryProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning' | 'error'>('all');
  const [metricFilter, setMetricFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'spike' | 'drop' | 'trend'>('all');

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      if (severityFilter !== 'all' && anomaly.severity !== severityFilter) return false;
      if (metricFilter !== 'all' && anomaly.metric !== metricFilter) return false;
      if (typeFilter !== 'all' && anomaly.type !== typeFilter) return false;
      return true;
    });
  }, [anomalies, severityFilter, metricFilter, typeFilter]);

  const metrics = useMemo(() => {
    return Array.from(new Set(anomalies.map(a => a.metric)));
  }, [anomalies]);

  const handleExport = () => {
    if (!onExport) return;
    onExport(filteredAnomalies);
  };

  const stats = useMemo(() => {
    return {
      total: anomalies.length,
      warnings: anomalies.filter(a => a.severity === 'warning').length,
      errors: anomalies.filter(a => a.severity === 'error').length,
      byMetric: metrics.reduce(
        (acc, metric) => {
          acc[metric] = anomalies.filter(a => a.metric === metric).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }, [anomalies, metrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Anomalies</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Warnings</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.warnings}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Errors</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</div>
          </Card>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricFilter} onValueChange={setMetricFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              {metrics.map(metric => (
                <SelectItem key={metric} value={metric}>
                  {metric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="spike">Spikes</SelectItem>
              <SelectItem value="drop">Drops</SelectItem>
              <SelectItem value="trend">Trends</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredAnomalies.map((anomaly, index) => (
            <div key={index} className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{anomaly.metric}</span>
                    <Badge variant={anomaly.severity === 'error' ? 'destructive' : 'default'}>
                      {anomaly.severity}
                    </Badge>
                    <Badge variant="outline">{anomaly.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{anomaly.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(anomaly.timestamp, 'PPpp')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{anomaly.value.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  vs {anomaly.threshold.toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          {filteredAnomalies.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No anomalies match the selected filters
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
