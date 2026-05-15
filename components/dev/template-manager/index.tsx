'use client';
import { lazy, Suspense } from 'react';
import { TemplateList } from '@/components/dev/TemplateList';
// If TemplateList is a custom component, import it from its canonical path, e.g.:
// import { TemplateList } from '@/components/dev/TemplateList';
const TemplateList = lazy(() => import('./components/TemplateList'));
export default function TemplateManager() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <TemplateList />
      </Suspense>
    </div>
  );
}
