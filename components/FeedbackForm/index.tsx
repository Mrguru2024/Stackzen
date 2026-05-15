import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const feedbackSchema = z.object({
  testerId: z.string().min(1, 'Tester ID is required'),
  date: z.string().min(1, 'Date is required'),
  timeSpent: z.string().min(1, 'Time spent is required'),
  featuresUsed: z.array(z.string()).min(1, 'Select at least one feature'),
  issues: z
    .array(
      z.object({
        feature: z.string().min(1, 'Feature name is required'),
        description: z.string().min(1, 'Description is required'),
        stepsToReproduce: z.string().min(1, 'Steps to reproduce are required'),
        expectedBehavior: z.string().min(1, 'Expected behavior is required'),
        actualBehavior: z.string().min(1, 'Actual behavior is required'),
        screenshots: z.string().optional(),
      })
    )
    .optional(),
  featureFeedback: z
    .array(
      z.object({
        feature: z.string().min(1, 'Feature name is required'),
        rating: z.number().min(1).max(5),
        workedWell: z.string().min(1, 'What worked well is required'),
        couldBeBetter: z.string().min(1, 'What could be better is required'),
        suggestions: z.string().min(1, 'Suggestions are required'),
      })
    )
    .optional(),
  performance: z.object({
    pageLoadTimes: z.enum(['Fast', 'Slow', 'Average']),
    responseTimes: z.enum(['Fast', 'Slow', 'Average']),
    lagFreezing: z.boolean(),
    lagDetails: z.string().optional(),
  }),
  deviceInfo: z.object({
    deviceType: z.enum(['Desktop', 'Tablet', 'Mobile']),
    os: z.string().min(1, 'OS is required'),
    browser: z.string().min(1, 'Browser is required'),
    screenResolution: z.string().min(1, 'Screen resolution is required'),
  }),
  generalComments: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
  });

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Daily Feedback Form</h2>

        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tester ID</label>
            <input type="text" {...register('testerId')} className="w-full rounded border p-2" />
            {errors.testerId && <p className="text-sm text-red-500">{errors.testerId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input type="date" {...register('date')} className="w-full rounded border p-2" />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>
        </div>

        {/* Features Used */}
        <div>
          <label className="mb-1 block text-sm font-medium">Features Used Today</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {[
              'Authentication',
              'Income Management',
              'Expense Tracking',
              'Quote Generation',
              'Invoice Creation',
              'AI Companion',
              'Calendar',
              'Notifications',
              'Admin Features',
            ].map(feature => (
              <label key={feature} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={feature}
                  {...register('featuresUsed')}
                  className="rounded"
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>
          {errors.featuresUsed && (
            <p className="text-sm text-red-500">{errors.featuresUsed.message}</p>
          )}
        </div>

        {/* Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Performance</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Page Load Times</label>
              <select
                {...register('performance.pageLoadTimes')}
                className="w-full rounded border p-2"
              >
                <option value="Fast">Fast</option>
                <option value="Average">Average</option>
                <option value="Slow">Slow</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Response Times</label>
              <select
                {...register('performance.responseTimes')}
                className="w-full rounded border p-2"
              >
                <option value="Fast">Fast</option>
                <option value="Average">Average</option>
                <option value="Slow">Slow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Device Type</label>
              <select {...register('deviceInfo.deviceType')} className="w-full rounded border p-2">
                <option value="Desktop">Desktop</option>
                <option value="Tablet">Tablet</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Operating System</label>
              <input
                type="text"
                {...register('deviceInfo.os')}
                className="w-full rounded border p-2"
                placeholder="e.g., macOS 12.0"
              />
            </div>
          </div>
        </div>

        {/* General Comments */}
        <div>
          <label className="mb-1 block text-sm font-medium">General Comments</label>
          <textarea
            {...register('generalComments')}
            className="h-32 w-full rounded border p-2"
            placeholder="Any additional feedback or observations..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}
