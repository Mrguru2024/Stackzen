import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMetric } from '@/lib/utils/performance-alerts';
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

interface PerformanceVisualizationsProps {
  metrics: PerformanceMetric[];
  timeWindow?: '1h' | '6h' | '24h' | '7d';
}

export function PerformanceVisualizations({
  metrics,
  timeWindow = '24h',
}: PerformanceVisualizationsProps) {
  const histogramData = useMemo(() => {
    const renderTimes = metrics.filter(m => m.metricName === 'renderTime').map(m => m.value);

    const bins = 10;
    const min = Math.min(...renderTimes);
    const max = Math.max(...renderTimes);
    const binSize = (max - min) / bins;

    const histogram = new Array(bins).fill(0);
    renderTimes.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    return {
      labels: Array.from({ length: bins }, (_, i) => {
        const start = min + i * binSize;
        const end = start + binSize;
        return `${start.toFixed(0)}-${end.toFixed(0)}ms`;
      }),
      datasets: [
        {
          label: 'Render Time Distribution',
          data: histogram,
          backgroundColor: 'rgba(94, 45, 235, 0.5)',
          borderColor: 'rgb(94, 45, 235)',
          borderWidth: 1,
        },
      ],
    };
  }, [metrics]);

  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => i);
    const data = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      data[day][hour] += metric.value;
    });

    return {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [
        {
          label: 'Performance Heatmap',
          data: data,
          backgroundColor: (context: any) => {
            const value = context.dataset.data[context.dataIndex];
            const alpha = Math.min(value / 1000, 1);
            return `rgba(94, 45, 235, ${alpha})`;
          },
        },
      ],
    };
  }, [metrics]);

  const componentDistribution = useMemo(() => {
    const componentMetrics = metrics.reduce(
      (acc, metric) => {
        acc[metric.componentName] = (acc[metric.componentName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      labels: Object.keys(componentMetrics),
      datasets: [
        {
          data: Object.values(componentMetrics),
          backgroundColor: [
            'rgba(94, 45, 235, 0.8)',
            'rgba(74, 230, 108, 0.8)',
            'rgba(247, 156, 66, 0.8)',
            'rgba(255, 179, 78, 0.8)',
          ],
        },
      ],
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="histogram" className="w-full">
        <TabsList>
          <TabsTrigger value="histogram">Histogram</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="histogram">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Render Time Distribution</h3>
            <div className="h-[400px]">
              <Bar
                data={histogramData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Frequency',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Render Time (ms)',
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Performance Heatmap</h3>
            <div className="h-[400px]">
              <Bar
                data={heatmapData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Day',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Hour',
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Component Distribution</h3>
            <div className="h-[400px]">
              <Doughnut
                data={componentDistribution}
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
      </Tabs>
    </div>
  );
}
