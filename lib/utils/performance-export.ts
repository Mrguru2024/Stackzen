import { PerformanceMetric } from './performance-alerts.ts';

interface ExportOptions {
  format: 'csv' | 'json';
  startTime?: Date;
  endTime?: Date;
  componentName?: string;
  metricNames?: string[];
}

export function exportPerformanceData(
  metrics: PerformanceMetric[],
  options: ExportOptions
): string {
  const { format = 'csv', startTime, endTime, componentName, metricNames } = options;

  // Filter metrics based on options
  let filteredMetrics = metrics;
  if (startTime) {
    filteredMetrics = filteredMetrics.filter(m => new Date(m.timestamp) >= startTime);
  }
  if (endTime) {
    filteredMetrics = filteredMetrics.filter(m => new Date(m.timestamp) <= endTime);
  }
  if (componentName) {
    filteredMetrics = filteredMetrics.filter(m => m.componentName === componentName);
  }
  if (metricNames) {
    filteredMetrics = filteredMetrics.filter(m => metricNames.includes(m.metricName));
  }

  if (format === 'json') {
    return JSON.stringify(filteredMetrics, null, 2);
  }

  // CSV format
  const headers = ['Timestamp', 'Component', 'Metric', 'Value', 'Unit'].join(',');

  const rows = filteredMetrics.map(metric => {
    const value = formatMetricValue(metric.value);
    return [
      new Date(metric.timestamp).toISOString(),
      metric.componentName,
      metric.metricName,
      value.value,
      value.unit,
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

function formatMetricValue(value: number): { value: number; unit: string } {
  if (value >= 1024 * 1024) {
    return { value: value / (1024 * 1024), unit: 'MB' };
  }
  if (value >= 1024) {
    return { value: value / 1024, unit: 'KB' };
  }
  return { value, unit: 'ms' };
}

export function generateExportFilename(options: ExportOptions, extension: string): string {
  const parts = ['performance-metrics'];
  if (options.componentName) {
    parts.push(options.componentName);
  }
  if (options.startTime) {
    parts.push(options.startTime.toISOString().split('T')[0]);
  }
  if (options.endTime) {
    parts.push(options.endTime.toISOString().split('T')[0]);
  }
  return `${parts.join('-')}.${extension}`;
}
