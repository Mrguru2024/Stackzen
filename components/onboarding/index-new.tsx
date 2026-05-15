import React from 'react';
import { lazy, Suspense } from 'react';
import OnboardingStep from './OnboardingStep';
const OnboardingStep = lazy(() => import('./components/OnboardingStep'));
export default function Onboarding() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <OnboardingStep />
      </Suspense>
    </div>
  );
}
