'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoalsStep } from './GoalsStep';
import { StepContainer } from './StepContainer';

// Form validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

const incomeSchema = z.object({
  income: z.number().min(1, 'Income must be greater than 0'),
  frequency: z.enum(['monthly', 'biweekly', 'weekly']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
});

const goalsSchema = z.object({
  goal: z.enum(['emergency', 'house', 'retirement', 'debt', 'other']),
  amount: z.number().min(1, 'Target amount must be greater than 0'),
  timeline: z.number().min(1, 'Timeline must be at least 1 month'),
});

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  validation?: z.ZodType<any>;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  // Form hooks
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      age: undefined,
    },
  });

  const incomeForm = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income: undefined,
      frequency: 'monthly',
      currency: 'USD',
    },
  });

  const goalsForm = useForm({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      goal: 'emergency',
      amount: undefined,
      timeline: undefined,
    },
  });

  // Focus management
  useEffect(() => {
    if (currentStep === 0) {
      const nextButton = document.querySelector('button[type="submit"]');
      if (nextButton) {
        (nextButton as HTMLElement).focus();
      }
    } else if (currentStep === 1) {
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
      }
    } else if (currentStep === 2) {
      const incomeInput = document.getElementById('income');
      if (incomeInput) {
        incomeInput.focus();
      }
    } else if (currentStep === 3) {
      const goalSelect = document.getElementById('goal');
      if (goalSelect) {
        goalSelect.focus();
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push('/dashboard');
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Stackzen',
      description: 'Your smart money management companion',
      component: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div className="text-center">
            <motion.h2
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Welcome to Stackzen
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-gray-600 dark:text-gray-300"
            >
              Let&apos;s get your financial journey started
            </motion.p>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          </motion.div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        </motion.div>
      ),
    },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Tell us about yourself',
      validation: profileSchema,
      component: (
        <ProfileStep
          formState={profileForm}
          handleSubmit={profileForm.handleSubmit(data => {
            setFormData({ ...formData, ...data });
            handleNext();
          })}
        />
      ),
    },
    {
      id: 'income',
      title: 'Income Split',
      description: 'Tell us about your income',
      validation: incomeSchema,
      component: (
        <IncomeStep
          formState={incomeForm}
          handleSubmit={incomeForm.handleSubmit(data => {
            setFormData({ ...formData, ...data });
            handleNext();
          })}
        />
      ),
    },
    {
      id: 'goals',
      title: 'Financial Goals',
      description: 'What are your primary financial goals?',
      validation: goalsSchema,
      component: (
        <GoalsStep
          formState={goalsForm}
          handleSubmit={goalsForm.handleSubmit(data => {
            setFormData({ ...formData, ...data });
            handleNext();
          })}
        />
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white px-4 py-8 shadow dark:bg-gray-800 sm:rounded-lg sm:px-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.component}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6">
            <div className="flex justify-between">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`mx-1 h-2 w-full rounded-full ${
                    index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  role="presentation"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StepContainer = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white" data-testid="step-title">
      {title}
    </h2>
    {children}
  </div>
);

const IncomeStep = ({ formState, handleSubmit }: StepProps) => {
  const {
    register,
    formState: { errors },
  } = formState;

  return (
    <StepContainer title="Income Split">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="income"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Monthly Income
            </label>
            <input
              type="number"
              id="income"
              {...register('income')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter your monthly income"
            />
            {errors.income && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.income.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="frequency"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Payment Frequency
            </label>
            <select
              id="frequency"
              {...register('frequency')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Biweekly</option>
              <option value="weekly">Weekly</option>
            </select>
            {errors.frequency && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.frequency.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Currency
            </label>
            <select
              id="currency"
              {...register('currency')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            {errors.currency && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.currency.message}</p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Next
          </button>
        </div>
      </form>
    </StepContainer>
  );
};

const GoalsStep = ({ formState, handleSubmit }: StepProps) => {
  const {
    register,
    formState: { errors },
  } = formState;

  return (
    <StepContainer title="Financial Goals">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Primary Goal
            </label>
            <select
              id="goal"
              {...register('goal')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="emergency">Emergency Fund</option>
              <option value="house">House Down Payment</option>
              <option value="retirement">Retirement</option>
              <option value="debt">Debt Payoff</option>
              <option value="other">Other</option>
            </select>
            {errors.goal && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.goal.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Target Amount
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                {...register('amount')}
                className="block w-full rounded-md border-gray-300 pl-12 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Enter your target amount"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="timeline"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Timeline (months)
            </label>
            <input
              type="number"
              id="timeline"
              {...register('timeline')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter your target timeline in months"
            />
            {errors.timeline && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.timeline.message}</p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Complete
          </button>
        </div>
      </form>
    </StepContainer>
  );
};

const ProfileStep = ({ formState, handleSubmit }: StepProps) => {
  const {
    register,
    formState: { errors },
  } = formState;

  return (
    <StepContainer title="Your Profile">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Age
            </label>
            <input
              type="number"
              id="age"
              {...register('age', { valueAsNumber: true })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Enter your age"
            />
            {errors.age && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.age.message}</p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Next
          </button>
        </div>
      </form>
    </StepContainer>
  );
};

export default Onboarding;
