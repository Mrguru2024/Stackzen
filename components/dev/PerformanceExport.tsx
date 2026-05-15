import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { PerformanceMetric } from '@/lib/utils/performance-alerts';
import { exportPerformanceData, generateExportFilename } from '@/lib/utils/performance-export';

interface PerformanceExportProps {
  metrics: PerformanceMetric[];
  componentName?: string;
}

export function PerformanceExport({ metrics, componentName }: PerformanceExportProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const handleExport = () => {
    try {
      const options = {
        format,
        startTime: startDate ? new Date(startDate) : undefined,
        endTime: endDate ? new Date(endDate) : undefined,
        componentName,
        metricNames: selectedMetrics.length > 0 ? selectedMetrics : undefined,
      };

      const data = exportPerformanceData(metrics, options);
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateExportFilename(options, format);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Performance data exported successfully');
    } catch (error) {
      toast.error('Failed to export performance data');
      console.error('Export error:', error);
    }
  };

  const availableMetrics = Array.from(new Set(metrics.map(m => m.metricName))).sort();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Export Performance Data</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormat('csv')}
              className={format === 'csv' ? 'bg-accent' : ''}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormat('json')}
              className={format === 'json' ? 'bg-accent' : ''}
            >
              <FileJson className="mr-2 h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Metrics to Export</Label>
          <Select
            value={selectedMetrics.join(',')}
            onValueChange={value => setSelectedMetrics(value ? value.split(',') : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select metrics to export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Metrics</SelectItem>
              {availableMetrics.map(metric => (
                <SelectItem key={metric} value={metric}>
                  {metric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} className="w-full" disabled={metrics.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export {format.toUpperCase()}
        </Button>
      </div>
    </Card>
  );
}

export default PerformanceExport;
