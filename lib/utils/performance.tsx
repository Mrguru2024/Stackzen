import React from 'react';
// Replace import of 'perf_hooks' with browser's performance API
// import { performance } from 'perf_hooks';
const performance = typeof window !== 'undefined' ? window.performance : { now: () => Date.now() };

export interface PerformanceMetric {
  componentName: string;
  metricName: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  warning: number;
  error: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  logToConsole: boolean;
  sendToAnalytics: boolean;
  thresholds: {
    renderTime: PerformanceThreshold;
    updateTime: PerformanceThreshold;
    memoryUsage: PerformanceThreshold;
    frameTime: PerformanceThreshold;
  };
}

const defaultConfig: PerformanceConfig = {
  enabled: process.env.NODE_ENV === 'development',
  logToConsole: true,
  sendToAnalytics: false,
  thresholds: {
    renderTime: { warning: 100, error: 200 },
    updateTime: { warning: 50, error: 100 },
    memoryUsage: { warning: 50 * 1024 * 1024, error: 100 * 1024 * 1024 }, // 50MB, 100MB
    frameTime: { warning: 16.67, error: 33.33 }, // 60fps, 30fps
  },
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  public configure(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public measureRender(componentName: string, startTime: number): void {
    if (!this.config.enabled) return;

    const _endTime = performance.now();
    const renderTime = _endTime - startTime;
    const metric: PerformanceMetric = {
      componentName,
      metricName: 'renderTime',
      value: renderTime,
      timestamp: Date.now(),
    };

    this.recordMetric(metric);
  }

  public measureUpdate(componentName: string, startTime: number): void {
    if (!this.config.enabled) return;

    const _endTime = performance.now();
    const updateTime = _endTime - startTime;
    const metric: PerformanceMetric = {
      componentName,
      metricName: 'updateTime',
      value: updateTime,
      timestamp: Date.now(),
    };

    this.recordMetric(metric);
  }

  public measureMemory(componentName: string): void {
    if (!this.config.enabled) return;

    const memoryUsage = process.memoryUsage().heapUsed;
    const metric: PerformanceMetric = {
      componentName,
      metricName: 'memoryUsage',
      value: memoryUsage,
      timestamp: Date.now(),
    };

    this.recordMetric(metric);
  }

  public measureFrameTime(componentName: string, frameTimes: number[]): void {
    if (!this.config.enabled) return;

    const _averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    const metric: PerformanceMetric = {
      componentName,
      metricName: 'frameTime',
      value: _averageFrameTime,
      timestamp: Date.now(),
      metadata: { frameCount: frameTimes.length },
    };

    this.recordMetric(metric);
  }

  public subscribe(callback: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  public getMetrics(componentName?: string): PerformanceMetric[] {
    return componentName
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.checkThresholds(metric);
    this.notifyObservers(metric);

    if (this.config.logToConsole) {
      this.logMetric(metric);
    }

    if (this.config.sendToAnalytics) {
      this.sendToAnalytics(metric);
    }
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold =
      this.config.thresholds[metric.metricName as keyof typeof this.config.thresholds];
    if (!threshold) return;

    if (metric.value >= threshold.error) {
      console.error(
        `Performance Error: ${metric.componentName} ${metric.metricName} exceeded error threshold`,
        metric
      );
    } else if (metric.value >= threshold.warning) {
      console.warn(
        `Performance Warning: ${metric.componentName} ${metric.metricName} exceeded warning threshold`,
        metric
      );
    }
  }

  private notifyObservers(metric: PerformanceMetric): void {
    this.observers.forEach(observer => observer(metric));
  }

  private logMetric(metric: PerformanceMetric): void {
    const { componentName, metricName, value, timestamp, metadata } = metric;
    console.log(
      `[Performance] ${componentName} - ${metricName}: ${value.toFixed(2)}ms`,
      metadata ? `(${JSON.stringify(metadata)})` : ''
    );
  }

  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    // Implement analytics integration here
    // Example: await analytics.track('performance_metric', metric);
  }
}

// React Hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const _monitor = PerformanceMonitor.getInstance();

  const measureRender = () => {
    const startTime = performance.now();
    return () => _monitor.measureRender(componentName, startTime);
  };

  const measureUpdate = () => {
    const startTime = performance.now();
    return () => _monitor.measureUpdate(componentName, startTime);
  };

  const measureMemory = () => {
    _monitor.measureMemory(componentName);
  };

  const measureFrameTime = (frameTimes: number[]) => {
    _monitor.measureFrameTime(componentName, frameTimes);
  };

  return {
    measureRender,
    measureUpdate,
    measureMemory,
    measureFrameTime,
  };
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function WithPerformanceMonitoring(props: P) {
    const { measureRender, measureUpdate } = usePerformanceMonitor(componentName);
    const endRender = measureRender();

    React.useEffect(() => {
      endRender();
    }, []);

    const _handleUpdate = measureUpdate();

    return React.createElement(WrappedComponent, { ...props, onUpdate: _handleUpdate });
  };
}

export default PerformanceMonitor;
