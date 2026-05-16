'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingData } from '@/types/onboarding';
import OnboardingStepWelcome from './steps/OnboardingStepWelcome';
import OnboardingStepPersonal from './steps/OnboardingStepPersonal';
import OnboardingStepDebt from './steps/OnboardingStepDebt';
import OnboardingStepExperience from './steps/OnboardingStepExperience';
import OnboardingStepSetup from './steps/OnboardingStepSetup';
import OnboardingStepComplete from './steps/OnboardingStepComplete';

const steps = ['welcome', 'personal', 'debt', 'experience', 'setup', 'complete'];

const OnboardingQuestionnaire: React.FC = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipsLeft, setSkipsLeft] = useState(2);

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }));
    setStep(s => s + 1);
  };

  const handleSkip = () => {
    if (skipsLeft > 0) {
      setSkipsLeft(skipsLeft - 1);
      setStep(s => s + 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }

      // Redirect to dashboard or next step
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const stepComponent = (() => {
      switch (steps[step]) {
        case 'welcome':
          return <OnboardingStepWelcome onNext={handleNext} />;
        case 'personal':
          return (
            <OnboardingStepPersonal
              onNext={handleNext}
              initialData={data}
              onSkip={handleSkip}
              skipsLeft={skipsLeft}
            />
          );
        case 'debt':
          return (
            <OnboardingStepDebt
              onNext={handleNext}
              initialData={data}
              onSkip={handleSkip}
              skipsLeft={skipsLeft}
            />
          );
        case 'experience':
          return (
            <OnboardingStepExperience
              onNext={handleNext}
              initialData={data}
              onSkip={handleSkip}
              skipsLeft={skipsLeft}
            />
          );
        case 'setup':
          return (
            <OnboardingStepSetup
              onNext={handleNext}
              initialData={data}
              onSkip={handleSkip}
              skipsLeft={skipsLeft}
            />
          );
        case 'complete':
          return (
            <OnboardingStepComplete
              onFinish={handleFinish}
              loading={loading}
              error={error}
              data={data}
            />
          );
        default:
          return null;
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-2xl"
        >
          {stepComponent}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index <= step ? 'bg-green-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full rounded-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Main Content */}
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;
