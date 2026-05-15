'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import Welcome from './steps/Welcome';
import SetupIncome from './steps/SetupIncome';
import SetupAllocation from './steps/SetupAllocation';
import SetupGoals from './steps/SetupGoals';
import Complete from './steps/Complete';

const steps = ['welcome', 'income', 'allocation', 'goals', 'complete'] as const;
type OnboardingStep = (typeof steps)[number];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState({
    income: '',
    incomeFrequency: 'monthly',
    needsPercentage: 40,
    wantsPercentage: 30,
    savingsPercentage: 30,
    savingsGoal: '',
    savingsGoalDate: '',
  });
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const _idx = steps.indexOf(currentStep);
    setProgress((_idx / (steps.length - 1)) * 100);
  }, [currentStep]);

  const _nextStep = () => {
    const _idx = steps.indexOf(currentStep);
    if (_idx < steps.length - 1) {
      setCurrentStep(steps[_idx + 1]);
    }
  };
  const _prevStep = () => {
    const _idx = steps.indexOf(currentStep);
    if (_idx > 0) {
      setCurrentStep(steps[_idx - 1]);
    }
  };
  const _skipOnboarding = () => {
    setCompleted(true);
  };
  const _finishOnboarding = async () => {
    // TODO: Replace with real API call
    setCompleted(true);
  };
  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  if (completed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Complete formData={formData} />
        <Button className="mt-8" href="/dashboard" asChild>
          <a>Go to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <Welcome />
          </motion.div>
        )}
        {currentStep === 'income' && (
          <motion.div
            key="income"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <SetupIncome formData={formData} updateFormData={updateFormData} />
          </motion.div>
        )}
        {currentStep === 'allocation' && (
          <motion.div
            key="allocation"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <SetupAllocation formData={formData} updateFormData={updateFormData} />
          </motion.div>
        )}
        {currentStep === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <SetupGoals formData={formData} updateFormData={updateFormData} />
          </motion.div>
        )}
        {currentStep === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <Complete formData={formData} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-8 flex justify-between">
        {currentStep !== 'welcome' ? (
          <Button variant="outline" onClick={_prevStep}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={_skipOnboarding}>
            Skip Setup
          </Button>
        )}
        {currentStep === 'complete' ? (
          <Button onClick={_finishOnboarding}>Finish</Button>
        ) : (
          <Button onClick={_nextStep}>Continue</Button>
        )}
      </div>
    </div>
  );
}
