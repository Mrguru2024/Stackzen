import React from 'react';
import { lazy, Suspense } from 'react';
import ChartComponent from '../ChartComponent';
// If ChartComponent is a custom component, import it from its canonical path, e.g.:
// import { ChartComponent } from '@/components/analytics/ChartComponent';
const ChartComponent = lazy(() => import('./components/ChartComponent'));
export default function TemplateAnalytics() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <ChartComponent />
      </Suspense>
    </div>
  );
}
