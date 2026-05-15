'use client';

import React from 'react';
import { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AnalyticsTimeRangeClientProps {
  initialTimeRange?: '7d' | '30d' | '90d' | '1y';
}

export function AnalyticsTimeRangeClient({
  initialTimeRange = '30d',
}: AnalyticsTimeRangeClientProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(initialTimeRange);

  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        {(['7d', '30d', '90d', '1y'] as const).map(range => (
          <button
            key={range}
            className={`rounded px-3 py-1 ${timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
            onClick={() => setTimeRange(range)}
            type="button"
          >
            {range}
          </button>
        ))}
      </div>
      <AnalyticsDashboard timeRange={timeRange} />
    </div>
  );
}
