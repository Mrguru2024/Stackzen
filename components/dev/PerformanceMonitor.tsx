import React from 'react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { Button } from '@/components/ui';
import { PerformanceMetric } from '@/lib/utils/performance';
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
  ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

interface PerformanceMonitorProps {
  componentName?: string;
  className?: string;
}

const TIME_WINDOW = 60 * 1000; // 1 minute
const UPDATE_INTERVAL = 1000; // 1 second

export function PerformanceMonitor({ componentName, className = '' }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    const unsubscribe = monitor.subscribe(metric => {
      if (!componentName || metric.componentName === componentName) {
        setMetrics(prev => [...prev, metric]);
      }
    });

    const interval = setInterval(() => {
      setMetrics(prev => prev.filter(metric => Date.now() - metric.timestamp < TIME_WINDOW));
    }, UPDATE_INTERVAL);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [componentName]);

  const _chartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Render Time (ms)',
        data: metrics.filter(m => m.metricName === 'renderTime').map(m => m.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Update Time (ms)',
        data: metrics.filter(m => m.metricName === 'updateTime').map(m => m.value),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Frame Time (ms)',
        data: metrics.filter(m => m.metricName === 'frameTime').map(m => m.value),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (ms)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const getLatestMetric = (metricName: string) => {
    return (
      metrics.filter(m => m.metricName === metricName).sort((a, b) => b.timestamp - a.timestamp)[0]
        ?.value || 0
    );
  };

  const getMetricColor = (metricName: string, value: number) => {
    const thresholds =
      monitor.config.thresholds[metricName as keyof typeof monitor.config.thresholds];
    if (!thresholds) return 'bg-gray-200';
    if (value >= thresholds.error) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderMetricCard = (metricName: string, label: string) => {
    const value = getLatestMetric(metricName);
    const color = getMetricColor(metricName, value);

    return (
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">{label}</h3>
          <span className="font-mono text-sm">{value.toFixed(2)}ms</span>
        </div>
        <Progress value={value} className={`h-2 ${color}`} />
      </Card>
    );
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Performance Monitor
          {componentName && ` - ${componentName}`}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {renderMetricCard('renderTime', 'Render Time')}
        {renderMetricCard('updateTime', 'Update Time')}
        {renderMetricCard('frameTime', 'Frame Time')}
      </div>

      {isExpanded && (
        <div className="mt-4">
          <div className="h-64">
            <Line data={_chartData} options={chartOptions} />
          </div>
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">Memory Usage</h3>
            {renderMetricCard('memoryUsage', 'Heap Used')}
          </div>
        </div>
      )}
    </Card>
  );
}
