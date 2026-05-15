'use client';

import React from 'react';
import { lazy, Suspense } from 'react';
const QuoteForm = lazy(() => import('./components/QuoteForm'));
export default function QuoteGenerator() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <QuoteForm />
      </Suspense>
    </div>
  );
}
