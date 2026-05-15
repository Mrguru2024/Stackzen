import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anomaly } from './PerformanceAnomalies.tsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import dynamic from 'next/dynamic';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
});

interface AnomalyTrendsProps {
  anomalies: Anomaly[];
  timeWindow?: '1h' | '6h' | '24h' | '7d';
}

export function AnomalyTrends({ anomalies, timeWindow = '24h' }: AnomalyTrendsProps) {
  const timeSeriesData = useMemo(() => {
    const now = Date.now();
    const windowMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeWindow];

    const startTime = now - windowMs;
    const interval = windowMs / 10; // 10 data points
    const labels = Array.from({ length: 11 }, (_, i) => {
      const time = startTime + i * interval;
      return new Date(time).toLocaleTimeString();
    });

    const severityData = {
      warning: new Array(11).fill(0),
      error: new Array(11).fill(0),
    };

    anomalies.forEach(anomaly => {
      const timeIndex = Math.min(
        Math.floor((anomaly.timestamp.getTime() - startTime) / interval),
        10
      );
      if (timeIndex >= 0) {
        severityData[anomaly.severity][timeIndex]++;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Warnings',
          data: severityData.warning,
          borderColor: 'rgb(234, 179, 8)',
          backgroundColor: 'rgba(234, 179, 8, 0.5)',
        },
        {
          label: 'Errors',
          data: severityData.error,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
        },
      ],
    };
  }, [anomalies, timeWindow]);

  const metricDistribution = useMemo(() => {
    const metrics = Array.from(new Set(anomalies.map(a => a.metric)));
    const data = metrics.map(metric => ({
      metric,
      count: anomalies.filter(a => a.metric === metric).length,
    }));

    return {
      labels: data.map(d => d.metric),
      datasets: [
        {
          data: data.map(d => d.count),
          backgroundColor: [
            'rgba(94, 45, 235, 0.8)',
            'rgba(74, 230, 108, 0.8)',
            'rgba(247, 156, 66, 0.8)',
            'rgba(255, 179, 78, 0.8)',
          ],
        },
      ],
    };
  }, [anomalies]);

  const typeDistribution = useMemo(() => {
    const types = ['spike', 'drop', 'trend'] as const;
    const data = types.map(type => ({
      type,
      count: anomalies.filter(a => a.type === type).length,
    }));

    return {
      labels: data.map(d => d.type),
      datasets: [
        {
          data: data.map(d => d.count),
          backgroundColor: [
            'rgba(94, 45, 235, 0.8)',
            'rgba(74, 230, 108, 0.8)',
            'rgba(247, 156, 66, 0.8)',
          ],
        },
      ],
    };
  }, [anomalies]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timeSeries" className="w-full">
        <TabsList>
          <TabsTrigger value="timeSeries">Time Series</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="timeSeries">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Anomaly Frequency</h3>
            <div className="h-[400px]">
              <Line
                data={timeSeriesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Anomalies',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Time',
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Metric Distribution</h3>
            <div className="h-[400px]">
              <Doughnut
                data={metricDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Anomaly Types</h3>
            <div className="h-[400px]">
              <Bar
                data={typeDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count',
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
