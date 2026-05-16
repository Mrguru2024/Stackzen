'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

const defaultMetrics = (): PerformanceMetrics => ({
  pageLoadTime: 0,
  domContentLoaded: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  timeToInteractive: 0,
});

function mergeMetrics(
  prev: PerformanceMetrics | null,
  patch: Partial<PerformanceMetrics>
): PerformanceMetrics {
  return { ...defaultMetrics(), ...prev, ...patch };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver(list => {
        const _entries = list.getEntries();
        _entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => mergeMetrics(prev, { largestContentfulPaint: entry.startTime }));
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Get navigation timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics({
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: 0, // Will be set by paint timing
          largestContentfulPaint: 0, // Will be set by observer
          timeToInteractive: navigation.domInteractive - navigation.fetchStart,
        });
      }

      // Get paint timing
      const _paintEntries = performance.getEntriesByType('paint');
      _paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => mergeMetrics(prev, { firstContentfulPaint: entry.startTime }));
        }
      });

      return () => observer.disconnect();
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return (
    <div className="font-mono fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 p-4 text-xs text-white">
      <div className="mb-2 font-bold">Performance Metrics</div>
      <div>Page Load: {metrics.pageLoadTime.toFixed(0)}ms</div>
      <div>DOM Ready: {metrics.domContentLoaded.toFixed(0)}ms</div>
      <div>FCP: {metrics.firstContentfulPaint.toFixed(0)}ms</div>
      <div>LCP: {metrics.largestContentfulPaint.toFixed(0)}ms</div>
      <div>TTI: {metrics.timeToInteractive.toFixed(0)}ms</div>
    </div>
  );
}

PerformanceMonitor.displayName = 'PerformanceMonitor';
