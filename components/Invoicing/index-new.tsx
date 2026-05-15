'use client';

import React from 'react';
import { lazy, Suspense } from 'react';
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const InvoiceForm = lazy(() => import('./components/InvoiceForm'));
export default function Invoicing() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <InvoiceList />
        <InvoiceForm />
      </Suspense>
    </div>
  );
}
