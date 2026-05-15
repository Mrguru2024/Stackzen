'use client';

import React from 'react';
import { lazy, Suspense } from 'react';
import { ImportForm } from './components/ImportForm';
import { TemplateManager } from './components/TemplateManager';
const ImportForm = lazy(() => import('./components/ImportForm'));
const TemplateManager = lazy(() => import('./components/TemplateManager'));
export default function DataImportDialog() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <ImportForm />
        <TemplateManager />
      </Suspense>
    </div>
  );
}
