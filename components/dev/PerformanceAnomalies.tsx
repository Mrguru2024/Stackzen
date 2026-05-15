import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { PerformanceMetric } from '@/lib/utils/performance-alerts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui';

interface PerformanceAnomaliesProps {
  metrics: PerformanceMetric[];
  timeWindow?: '1h' | '6h' | '24h' | '7d';
}

export interface Anomaly {
  id?: string;
  type: 'spike' | 'drop' | 'trend';
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'error';
  description: string;
}

export function PerformanceAnomalies({ metrics, timeWindow = '24h' }: PerformanceAnomaliesProps) {
  const anomalies = useMemo(() => {
    if (metrics.length < 2) return [];

    const detectedAnomalies: Anomaly[] = [];
    const metricTypes = ['renderTime', 'updateTime', 'frameTime', 'memoryUsage'];

    metricTypes.forEach(metricType => {
      const values = metrics.filter(m => m.metricName === metricType).map(m => m.value);

      if (values.length < 2) return;

      // Calculate mean and standard deviation
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Detect spikes and drops (values outside 2 standard deviations)
      values.forEach((value, index) => {
        const zScore = Math.abs(value - mean) / stdDev;
        if (zScore > 2) {
          const metric = metrics.find(m => m.metricName === metricType && m.value === value);
          if (!metric) return;

          detectedAnomalies.push({
            type: value > mean ? 'spike' : 'drop',
            metric: metricType,
            value,
            threshold: mean + (value > mean ? 2 : -2) * stdDev,
            timestamp: metric.timestamp,
            severity: zScore > 3 ? 'error' : 'warning',
            description: `${metricType} ${
              value > mean ? 'spiked' : 'dropped'
            } to ${value.toFixed(2)} (${zScore.toFixed(1)}σ from mean)`,
          });
        }
      });

      // Detect trends (3 consecutive increases or decreases)
      for (let i = 2; i < values.length; i++) {
        const trend = values.slice(i - 2, i + 1);
        const isIncreasing = trend[0] < trend[1] && trend[1] < trend[2];
        const isDecreasing = trend[0] > trend[1] && trend[1] > trend[2];

        if (isIncreasing || isDecreasing) {
          const metric = metrics.find(m => m.metricName === metricType && m.value === trend[2]);
          if (!metric) return;

          detectedAnomalies.push({
            type: 'trend',
            metric: metricType,
            value: trend[2],
            threshold: mean,
            timestamp: metric.timestamp,
            severity: 'warning',
            description: `${metricType} is ${
              isIncreasing ? 'increasing' : 'decreasing'
            } over 3 measurements`,
          });
        }
      }
    });

    return detectedAnomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [metrics]);

  if (anomalies.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No anomalies detected in the selected time window
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {anomalies.map((anomaly, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-full p-2 ${
                  anomaly.severity === 'error'
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : 'bg-yellow-100 dark:bg-yellow-900/20'
                }`}
              >
                {anomaly.type === 'trend' ? (
                  anomaly.value > anomaly.threshold ? (
                    <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{anomaly.metric}</span>
                  <Badge variant={anomaly.severity === 'error' ? 'destructive' : 'default'}>
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{anomaly.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {anomaly.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{anomaly.value.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">vs {anomaly.threshold.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
