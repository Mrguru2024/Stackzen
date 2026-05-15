'use client';

import React from 'react';
import { Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/dev/PerformanceMonitor';
import { AlertSettings } from '@/components/dev/AlertSettings';
import { PerformanceAnomalies } from '@/components/dev/PerformanceAnomalies';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Download,
  Wifi,
  WifiOff,
  Settings,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Share2,
  BarChart,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  FileText,
  BarChart3,
  Users,
} from 'lucide-react';
import { usePerformanceWebSocket } from '@/lib/hooks/usePerformanceWebSocket';
import { toast } from 'sonner';
import {
  AlertConfig,
  defaultAlertConfig,
  type PerformanceMetric,
} from '@/lib/utils/performance-alerts';
import { PerformanceExport } from '@/components/dev/PerformanceExport';
import { PerformanceVisualizations } from '@/components/dev/PerformanceVisualizations';
import { AnomalyHistory } from '@/components/dev/AnomalyHistory';
import { AnomalyTrends } from '@/components/dev/AnomalyTrends';
import { AnomalyResolution } from '@/components/dev/AnomalyResolution';
import { ResolutionStats } from '@/components/dev/ResolutionStats';
import { TemplateCategories } from '@/components/dev/TemplateCategories';
import { TemplateManager } from '@/components/dev/TemplateManager';
import { TemplateVersionComparison } from '@/components/dev/TemplateVersionComparison';
import type { Anomaly } from '@/components/dev/PerformanceAnomalies';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TemplateAnalytics = dynamic(() => import('@/components/dev/TemplateAnalytics'), {
  ssr: false,
  loading: () => <div>Loading analytics...</div>,
});

function PerformanceDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function buildAnomaliesFromMetrics(metrics: PerformanceMetric[]): Anomaly[] {
  return metrics.flatMap(metric => {
    const out: Anomaly[] = [];
    const { metricName, value, timestamp, componentName } = metric;
    const makeId = (suffix: string) =>
      `${componentName}-${metricName}-${timestamp.getTime()}-${suffix}`;

    if (metricName === 'renderTime' && value > 100) {
      out.push({
        id: makeId('rt'),
        type: 'spike',
        metric: 'renderTime',
        value,
        threshold: 100,
        timestamp,
        severity: 'warning',
        description: `Render time spiked to ${value.toFixed(2)}ms`,
      });
    }
    if (metricName === 'updateTime' && value > 50) {
      out.push({
        id: makeId('ut'),
        type: 'spike',
        metric: 'updateTime',
        value,
        threshold: 50,
        timestamp,
        severity: 'warning',
        description: `Update time spiked to ${value.toFixed(2)}ms`,
      });
    }
    if (metricName === 'frameTime' && value > 16.67) {
      out.push({
        id: makeId('ft'),
        type: 'spike',
        metric: 'frameTime',
        value,
        threshold: 16.67,
        timestamp,
        severity: 'error',
        description: `Frame time exceeded 60fps threshold at ${value.toFixed(2)}ms`,
      });
    }
    const memoryMb = value / (1024 * 1024);
    if (metricName === 'memoryUsage' && memoryMb > 100) {
      out.push({
        id: makeId('mem'),
        type: 'spike',
        metric: 'memoryUsage',
        value: memoryMb,
        threshold: 100,
        timestamp,
        severity: 'warning',
        description: `Memory usage spiked to ${memoryMb.toFixed(2)}MB`,
      });
    }
    return out;
  });
}

function ExportButton({ componentName }: { componentName?: string }) {
  const handleExport = useCallback(async () => {
    const params = new URLSearchParams({
      format: 'csv',
      ...(componentName && { componentName }),
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      endTime: new Date().toISOString(),
    });

    const response = await fetch(`/api/performance?${params}`);
    if (!response.ok) {
      console.error('Failed to export metrics');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${componentName || 'all'}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [componentName]);

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(defaultAlertConfig);
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [templates, setTemplates] = useState([
    {
      id: '1',
      name: 'Render Time Spike',
      description: 'Template for handling React render performance issues',
      metric: 'Render Time',
      type: 'Performance',
      severity: 'warning' as const,
      steps: ['Check component re-renders', 'Analyze dependency arrays', 'Implement memoization'],
      notes: 'Common in large component trees',
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'John Doe',
      lastModifiedBy: 'John Doe',
      category: 'Performance',
      tags: ['react', 'performance', 'optimization'],
    },
    {
      id: '2',
      name: 'Memory Leak',
      description: 'Template for identifying and fixing memory leaks',
      metric: 'Memory Usage',
      type: 'Memory',
      severity: 'error' as const,
      steps: ['Check event listeners', 'Analyze cleanup functions', 'Monitor heap usage'],
      notes: 'Critical for long-running applications',
      version: 1,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      createdBy: 'Jane Smith',
      lastModifiedBy: 'Jane Smith',
      category: 'Memory',
      tags: ['memory', 'leak', 'performance'],
    },
    {
      id: '3',
      name: 'API Timeout',
      description: 'Template for handling API timeout issues',
      metric: 'Response Time',
      type: 'Network',
      severity: 'warning' as const,
      steps: ['Check network connectivity', 'Verify API endpoints', 'Implement retry logic'],
      notes: 'Common in high-latency environments',
      version: 1,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      createdBy: 'Mike Johnson',
      lastModifiedBy: 'Mike Johnson',
      category: 'Network',
      tags: ['api', 'network', 'timeout'],
    },
  ]);

  const [templateResolutions] = useState([
    {
      id: 'r1',
      templateId: '1',
      status: 'resolved' as const,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000),
      assignedTo: 'alice',
      notes: 'Example resolution',
    },
    {
      id: 'r2',
      templateId: '2',
      status: 'in_progress' as const,
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000),
      assignedTo: 'bob',
      notes: 'In progress',
    },
    {
      id: 'r3',
      templateId: '3',
      status: 'failed' as const,
      startTime: new Date(),
      endTime: new Date(),
      assignedTo: 'alice',
      notes: 'Failed run',
    },
  ]);

  const [resolutionRecords] = useState([
    {
      id: 'ar1',
      anomalyId: 'a1',
      status: 'resolved' as const,
      assignedTo: 'ops',
      notes: 'Closed spike',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(),
      resolutionTime: 45,
    },
    {
      id: 'ar2',
      anomalyId: 'a2',
      status: 'in_progress' as const,
      assignedTo: 'ops',
      notes: 'Investigating',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(() =>
    Array.from(new Set(templates.map(t => t.category)))
  );

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every(tag => template.tags.includes(tag));
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesTags && matchesSearch;
    });
  }, [templates, selectedCategory, selectedTags, searchQuery]);

  const handleMetric = useCallback((metric: PerformanceMetric) => {
    setMetrics(prev => [...prev, metric]);
  }, []);

  const handleInitial = useCallback((initialMetrics: PerformanceMetric[]) => {
    setMetrics(initialMetrics);
  }, []);

  const { isConnected: wsConnected } = usePerformanceWebSocket(handleMetric, handleInitial);

  // Update connection status
  if (wsConnected !== isConnected) {
    setIsConnected(wsConnected);
    if (wsConnected) {
      toast.success('Real-time updates connected');
    } else {
      toast.error('Real-time updates disconnected');
    }
  }

  const handleAlertConfigChange = useCallback((newConfig: AlertConfig) => {
    setAlertConfig(newConfig);
    toast.success('Alert settings updated');
  }, []);

  const handleTimeWindowChange = (window: '1h' | '6h' | '24h' | '7d') => {
    setTimeWindow(window);
  };

  useEffect(() => {
    // WebSocket connection for real-time metrics
    const ws = new WebSocket('ws://localhost:3001/performance');

    ws.onmessage = event => {
      const newMetric = JSON.parse(event.data);
      setMetrics(prev => [...prev, newMetric]);
    };

    return () => ws.close();
  }, []);

  const handleExportAnomalies = (anomalies: any[]) => {
    const csv = [
      ['Timestamp', 'Metric', 'Type', 'Severity', 'Value', 'Threshold', 'Description'],
      ...anomalies.map(a => [
        a.timestamp.toISOString(),
        a.metric,
        a.type,
        a.severity,
        a.value,
        a.threshold,
        a.description,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomalies-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Anomalies exported successfully');
  };

  const handleTemplateUpdate = (updatedTemplate: any) => {
    setTemplates(prev => prev.map(t => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    toast.success('Template updated successfully');
  };

  const handleTemplateShare = (template: any, recipients: string[]) => {
    console.log('Sharing template:', template, 'with recipients:', recipients);
    toast.success(`Template shared with ${recipients.length} recipients`);
  };

  const handleTemplateImport = (importedTemplates: any[]) => {
    setTemplates(prev => {
      const merged = [...prev];
      importedTemplates.forEach(imported => {
        const existingIndex = merged.findIndex(t => t.id === imported.id);
        if (existingIndex >= 0) {
          if (imported.version > merged[existingIndex].version) {
            merged[existingIndex] = imported;
          }
        } else {
          merged.push(imported);
        }
      });
      return merged;
    });
  };

  const handleCategoryAdd = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
      toast.success(`Category "${category}" added successfully`);
    } else {
      toast.error('Category already exists');
    }
  };

  const handleCategoryDelete = (category: string) => {
    // Check if category is in use
    const templatesInCategory = templates.filter(t => t.category === category);
    if (templatesInCategory.length > 0) {
      toast.error(
        `Cannot delete category "${category}" - it contains ${templatesInCategory.length} templates`
      );
      return;
    }

    setCategories(categories.filter(c => c !== category));
    toast.success(`Category "${category}" deleted successfully`);
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and analyze application performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <ExportButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-2 text-lg font-semibold">Average Render Time</h3>
          <p className="text-3xl font-bold">
            {(() => {
              const subset = metrics.filter(m => m.metricName === 'renderTime');
              return subset.length > 0
                ? (subset.reduce((acc, m) => acc + m.value, 0) / subset.length).toFixed(2)
                : '0.00';
            })()}{' '}
            ms
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="mb-2 text-lg font-semibold">Memory Usage</h3>
          <p className="text-3xl font-bold">
            {(() => {
              const subset = metrics.filter(m => m.metricName === 'memoryUsage');
              return subset.length > 0
                ? (subset.reduce((acc, m) => acc + m.value, 0) / subset.length / (1024 * 1024)).toFixed(2)
                : '0.00';
            })()}{' '}
            MB
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="mb-2 text-lg font-semibold">Frame Rate</h3>
          <p className="text-3xl font-bold">
            {(() => {
              const subset = metrics.filter(m => m.metricName === 'frameTime');
              return subset.length > 0
                ? (1000 / (subset.reduce((acc, m) => acc + m.value, 0) / subset.length)).toFixed(1)
                : '0.0';
            })()}{' '}
            FPS
          </p>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="resolution">Resolution</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<PerformanceDashboardSkeleton />}>
            <PerformanceMonitor />
          </Suspense>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
            <div className="flex gap-2">
              <Button
                variant={timeWindow === '1h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeWindowChange('1h')}
              >
                1h
              </Button>
              <Button
                variant={timeWindow === '6h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeWindowChange('6h')}
              >
                6h
              </Button>
              <Button
                variant={timeWindow === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeWindowChange('24h')}
              >
                24h
              </Button>
              <Button
                variant={timeWindow === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeWindowChange('7d')}
              >
                7d
              </Button>
            </div>
          </div>
          <AnomalyTrends anomalies={buildAnomaliesFromMetrics(metrics)} timeWindow={timeWindow} />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
              <div className="flex gap-2">
                <Button
                  variant={timeWindow === '1h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('1h')}
                >
                  1h
                </Button>
                <Button
                  variant={timeWindow === '6h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('6h')}
                >
                  6h
                </Button>
                <Button
                  variant={timeWindow === '24h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeWindow === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('7d')}
                >
                  7d
                </Button>
              </div>
            </div>
            <PerformanceAnomalies metrics={metrics} timeWindow={timeWindow} />
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Component Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>GoalNotifications</span>
                <div className="flex items-center gap-4">
                  <span>
                    {metrics
                      .filter(m => m.componentName === 'GoalNotifications')
                      .reduce((acc, m) => acc + m.value, 0) / metrics.length || 0}
                    ms
                  </span>
                  <ExportButton componentName="GoalNotifications" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>WellnessDashboard</span>
                <div className="flex items-center gap-4">
                  <span>
                    {metrics
                      .filter(m => m.componentName === 'WellnessDashboard')
                      .reduce((acc, m) => acc + m.value, 0) / metrics.length || 0}
                    ms
                  </span>
                  <ExportButton componentName="WellnessDashboard" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>QuoteForm</span>
                <div className="flex items-center gap-4">
                  <span>
                    {metrics
                      .filter(m => m.componentName === 'QuoteForm')
                      .reduce((acc, m) => acc + m.value, 0) / metrics.length || 0}
                    ms
                  </span>
                  <ExportButton componentName="QuoteForm" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Memory Usage</h3>
            <div className="space-y-4">
              {metrics
                .filter(m => m.metricName === 'memoryUsage')
                .map(metric => (
                  <div
                    key={`${metric.componentName}-${metric.timestamp.getTime()}`}
                    className="flex items-center justify-between"
                  >
                    <span>{metric.componentName}</span>
                    <span>{Math.round(metric.value / 1024 / 1024)} MB</span>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Network Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>API Response Time</span>
                <span>
                  {metrics
                    .filter(m => m.metricName === 'apiResponseTime')
                    .reduce((acc, m) => acc + m.value, 0) / metrics.length || 0}
                  ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Data Transfer</span>
                <span>
                  {Math.round(
                    metrics
                      .filter(m => m.metricName === 'dataTransfer')
                      .reduce((acc, m) => acc + m.value, 0) /
                      1024 /
                      1024
                  )}
                  MB
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertSettings initialConfig={alertConfig} onConfigChange={handleAlertConfigChange} />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <PerformanceExport metrics={metrics} />
        </TabsContent>

        <TabsContent value="stats">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Resolution Statistics</h2>
              <div className="flex gap-2">
                <Button
                  variant={timeWindow === '1h' ? 'default' : 'outline'}
                  onClick={() => setTimeWindow('1h')}
                >
                  1h
                </Button>
                <Button
                  variant={timeWindow === '6h' ? 'default' : 'outline'}
                  onClick={() => setTimeWindow('6h')}
                >
                  6h
                </Button>
                <Button
                  variant={timeWindow === '24h' ? 'default' : 'outline'}
                  onClick={() => setTimeWindow('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeWindow === '7d' ? 'default' : 'outline'}
                  onClick={() => setTimeWindow('7d')}
                >
                  7d
                </Button>
              </div>
            </div>
            <ResolutionStats resolutions={resolutionRecords} timeWindow={timeWindow} />
          </Card>
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex justify-end">
              <div className="flex gap-2">
                <Button
                  variant={timeWindow === '1h' ? 'default' : 'outline'}
                  onClick={() => handleTimeWindowChange('1h')}
                >
                  1h
                </Button>
                <Button
                  variant={timeWindow === '6h' ? 'default' : 'outline'}
                  onClick={() => handleTimeWindowChange('6h')}
                >
                  6h
                </Button>
                <Button
                  variant={timeWindow === '24h' ? 'default' : 'outline'}
                  onClick={() => handleTimeWindowChange('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeWindow === '7d' ? 'default' : 'outline'}
                  onClick={() => handleTimeWindowChange('7d')}
                >
                  7d
                </Button>
              </div>
            </div>
            <PerformanceVisualizations metrics={metrics} timeWindow={timeWindow} />
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
              <div className="flex gap-2">
                <Button
                  variant={timeWindow === '1h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('1h')}
                >
                  1h
                </Button>
                <Button
                  variant={timeWindow === '6h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('6h')}
                >
                  6h
                </Button>
                <Button
                  variant={timeWindow === '24h' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('24h')}
                >
                  24h
                </Button>
                <Button
                  variant={timeWindow === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeWindowChange('7d')}
                >
                  7d
                </Button>
              </div>
            </div>
            <AnomalyHistory
              anomalies={buildAnomaliesFromMetrics(metrics)}
              onExport={anomalies => {
                const csv = [
                  ['Timestamp', 'Metric', 'Type', 'Severity', 'Value', 'Threshold', 'Description'],
                  ...anomalies.map(a => [
                    a.timestamp.toISOString(),
                    a.metric,
                    a.type,
                    a.severity,
                    a.value.toString(),
                    a.threshold.toString(),
                    a.description,
                  ]),
                ]
                  .map(row => row.map(cell => `"${cell}"`).join(','))
                  .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `anomalies-${new Date().toISOString()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="resolution">
          <Card className="p-6">
            <AnomalyResolution
              anomalies={buildAnomaliesFromMetrics(metrics)}
              onResolutionUpdate={resolution => {
                console.log('Resolution updated:', resolution);
                toast.success('Resolution status updated');
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <TemplateCategories
                templates={templates}
                onCategorySelect={setSelectedCategory}
                onTagSelect={setSelectedTags}
                onSearch={setSearchQuery}
                onCategoryAdd={handleCategoryAdd}
                onCategoryDelete={handleCategoryDelete}
              />
            </div>
            <div className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Template Manager</CardTitle>
                  <CardDescription>Create and manage performance issue templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <TemplateManager
                    templates={filteredTemplates}
                    onTemplateUpdate={handleTemplateUpdate}
                    onTemplateShare={handleTemplateShare}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>Compare different versions of templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <TemplateVersionComparison
                    template={templates[0]}
                    versions={[
                      {
                        ...templates[0],
                        version: 1,
                        steps: [
                          'Check component re-renders',
                          'Analyze dependency arrays',
                          'Implement memoization',
                        ],
                        updatedAt: new Date('2024-01-01'),
                        lastModifiedBy: 'John Doe',
                        notes: 'Initial version',
                      },
                      templates[0],
                    ]}
                    onVersionSelect={version => console.log('Selected version:', version)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Template Analytics
              </CardTitle>
              <CardDescription>Track template usage and resolution effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateAnalytics
                templates={templates}
                resolutions={templateResolutions}
                timeWindow="24h"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
