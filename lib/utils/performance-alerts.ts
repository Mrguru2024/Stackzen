import { toast } from 'sonner';

export interface AlertThreshold {
  warning: number;
  error: number;
}

export interface AlertConfig {
  renderTime: AlertThreshold;
  updateTime: AlertThreshold;
  frameTime: AlertThreshold;
  memoryUsage: AlertThreshold;
  apiResponseTime: AlertThreshold;
}

export const defaultAlertConfig: AlertConfig = {
  renderTime: { warning: 50, error: 100 },
  updateTime: { warning: 30, error: 60 },
  frameTime: { warning: 16, error: 32 },
  memoryUsage: { warning: 100 * 1024 * 1024, error: 200 * 1024 * 1024 }, // 100MB, 200MB
  apiResponseTime: { warning: 200, error: 500 },
};

export interface PerformanceMetric {
  componentName: string;
  metricName: string;
  value: number;
  timestamp: Date;
}

export class PerformanceAlertManager {
  private config: AlertConfig;
  private lastAlertTime: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN = 60000; // 1 minute

  constructor(config: AlertConfig = defaultAlertConfig) {
    this.config = config;
  }

  public checkMetric(metric: PerformanceMetric) {
    const threshold = this.config[metric.metricName as keyof AlertConfig];
    if (!threshold) return;

    const alertKey = `${metric.componentName}-${metric.metricName}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;

    if (now - lastAlert < this.ALERT_COOLDOWN) return;

    if (metric.value >= threshold.error) {
      this.triggerAlert(metric, 'error');
      this.lastAlertTime.set(alertKey, now);
    } else if (metric.value >= threshold.warning) {
      this.triggerAlert(metric, 'warning');
      this.lastAlertTime.set(alertKey, now);
    }
  }

  private triggerAlert(metric: PerformanceMetric, severity: 'warning' | 'error') {
    const formattedValue = this.formatMetricValue(metric);
    const message = this.formatAlertMessage(metric, formattedValue);

    if (severity === 'error') {
      toast.error(message, {
        duration: 10000,
        action: {
          label: 'View Details',
          onClick: () => {
            // Navigate to performance dashboard
            window.location.href = '/dev/performance';
          },
        },
      });
    } else {
      toast.warning(message, {
        duration: 5000,
      });
    }
  }

  private formatMetricValue(metric: PerformanceMetric): string {
    switch (metric.metricName) {
      case 'memoryUsage':
        return `${Math.round(metric.value / 1024 / 1024)}MB`;
      case 'frameTime':
        return `${Math.round(1000 / metric.value)}fps`;
      default:
        return `${Math.round(metric.value)}ms`;
    }
  }

  private formatAlertMessage(metric: PerformanceMetric, value: string): string {
    const component = metric.componentName;
    const metricType = metric.metricName.replace(/([A-Z])/g, ' $1').toLowerCase();

    return `${component}: ${metricType} is ${value}`;
  }

  public updateConfig(newConfig: Partial<AlertConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}
