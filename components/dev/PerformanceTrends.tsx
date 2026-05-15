import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PerformanceMetric } from '@/lib/utils/performance-alerts';
import { _format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

interface PerformanceTrendsProps {
  metrics: PerformanceMetric[];
  timeWindow?: '1h' | '6h' | '24h' | '7d';
}

export function PerformanceTrends({ metrics, timeWindow = '24h' }: PerformanceTrendsProps) {
  const _filteredMetrics = useMemo(() => {
    const now = Date.now();
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeWindow];

    return metrics.filter(metric => now - new Date(metric.timestamp).getTime() <= windowMs);
  }, [metrics, timeWindow]);

  const _chartData = useMemo(() => {
    const _groupedMetrics = _filteredMetrics.reduce(
      (acc, metric) => {
        const time = _format(new Date(metric.timestamp), 'HH:mm');
        if (!acc[time]) {
          acc[time] = {};
        }
        if (!acc[time][metric.metricName]) {
          acc[time][metric.metricName] = [];
        }
        acc[time][metric.metricName].push(metric.value);
        return acc;
      },
      {} as Record<string, Record<string, number[]>>
    );

    const labels = Object.keys(_groupedMetrics).sort();
    const datasets = ['renderTime', 'updateTime', 'frameTime', 'memoryUsage'].map(metricName => ({
      label: metricName.replace(/([A-Z])/g, ' $1').toLowerCase(),
      data: labels.map(time => {
        const _values = _groupedMetrics[time][metricName] || [];
        return _values.length ? _values.reduce((a, b) => a + b, 0) / _values.length : 0;
      }),
      borderColor: getMetricColor(metricName),
      tension: 0.4,
    }));

    return {
      labels: labels,
      datasets: datasets,
    };
  }, [_filteredMetrics]);

  const _chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Performance Trends (${timeWindow})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatMetricValue(value),
        },
      },
    },
  };

  const _trends = useMemo(() => {
    const _calculateTrend = (metricName: string) => {
      const _values = _filteredMetrics.filter(m => m.metricName === metricName).map(m => m.value);
      if (_values.length < 2) return 0;

      const _firstHalf = _values.slice(0, Math.floor(_values.length / 2));
      const _secondHalf = _values.slice(Math.floor(_values.length / 2));
      const _firstAvg = _firstHalf.reduce((a, b) => a + b, 0) / _firstHalf.length;
      const _secondAvg = _secondHalf.reduce((a, b) => a + b, 0) / _secondHalf.length;

      return ((_secondAvg - _firstAvg) / _firstAvg) * 100;
    };

    return {
      renderTime: _calculateTrend('renderTime'),
      updateTime: _calculateTrend('updateTime'),
      frameTime: _calculateTrend('frameTime'),
      memoryUsage: _calculateTrend('memoryUsage'),
    };
  }, [_filteredMetrics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(_trends).map(([metric, trend]) => (
          <Card key={metric} className="p-4">
            <h4 className="mb-2 text-sm font-medium capitalize">
              {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-semibold ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}
              >
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">trend</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <Line data={_chartData} options={_chartOptions} />
      </Card>
    </div>
  );
}

function getMetricColor(metricName: string): string {
  switch (metricName) {
    case 'renderTime':
      return '#5E2DEB';
    case 'updateTime':
      return '#4AE66C';
    case 'frameTime':
      return '#F79C42';
    case 'memoryUsage':
      return '#FF6B6B';
    default:
      return '#9CA3AF';
  }
}

function formatMetricValue(value: number): string {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)}KB`;
  }
  return `${value.toFixed(1)}ms`;
}
