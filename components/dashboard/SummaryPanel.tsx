import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { formatCurrency } from '@lib/utils';

export interface SummaryMetric {
  label: string;
  value: number;
  currency?: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export interface SummaryPanelProps {
  title: string;
  metrics: SummaryMetric[];
  className?: string;
}

/**
 * Summary panel component for displaying key metrics
 */
export function SummaryPanel({ title, metrics, className }: SummaryPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold">
                {metric.currency
                  ? formatCurrency(metric.value, metric.currency)
                  : metric.value.toLocaleString()}
              </p>
              {metric.change !== undefined && (
                <p
                  className={`text-sm ${
                    metric.changeType === 'positive'
                      ? 'text-green-600'
                      : metric.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change}%
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
