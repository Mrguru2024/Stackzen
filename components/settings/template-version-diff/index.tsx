import React from 'react';
import { lazy, Suspense } from 'react';
import { VersionList } from './VersionList';
const VersionList = lazy(() => import('./components/VersionList'));
export default function TemplateVersionDiff() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <VersionList />
      </Suspense>
    </div>
  );
}

export { default } from '../template-version-diff';
