import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const feedbackSchema = z.object({
  timeSpent: z.string().min(1, 'Time spent is required'),
  featuresUsed: z.array(z.string()).min(1, 'Select at least one feature'),
  issues: z
    .array(
      z.object({
        feature: z.string(),
        description: z.string(),
        stepsToReproduce: z.string(),
        expectedBehavior: z.string(),
        actualBehavior: z.string(),
        screenshots: z.string().optional(),
      })
    )
    .optional(),
  featureFeedback: z
    .array(
      z.object({
        feature: z.string(),
        rating: z.number().min(1).max(5),
        workedWell: z.string(),
        couldBeBetter: z.string(),
        suggestions: z.string(),
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
    os: z.string(),
    browser: z.string(),
    screenResolution: z.string(),
  }),
  generalComments: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const FEATURES = [
  'Authentication',
  'Income Tracking',
  'Expense Management',
  'Quote Builder',
  'Invoice System',
  'AI Companion',
  'Calendar',
  'Notifications',
];

export function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      featuresUsed: [],
      performance: {
        pageLoadTimes: 'Average',
        responseTimes: 'Average',
        lagFreezing: false,
      },
      deviceInfo: {
        deviceType: 'Desktop',
        os: navigator.platform,
        browser: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Beta Tester Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Time Spent Testing</label>
              <Input
                {...register('timeSpent')}
                placeholder="e.g., 2 hours"
                className={errors.timeSpent ? 'border-red-500' : ''}
              />
              {errors.timeSpent && (
                <p className="mt-1 text-sm text-red-500">{errors.timeSpent.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Features Used</label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={watch('featuresUsed').includes(feature)}
                      onCheckedChange={checked => {
                        const current = watch('featuresUsed');
                        setValue(
                          'featuresUsed',
                          checked ? [...current, feature] : current.filter(f => f !== feature)
                        );
                      }}
                    />
                    <label htmlFor={feature} className="text-sm">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Performance</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Page Load Times</label>
                  <Select
                    onValueChange={value => setValue('performance.pageLoadTimes', value as any)}
                    defaultValue="Average"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fast">Fast</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Slow">Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Response Times</label>
                  <Select
                    onValueChange={value => setValue('performance.responseTimes', value as any)}
                    defaultValue="Average"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fast">Fast</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Slow">Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">General Comments</label>
              <Textarea
                {...register('generalComments')}
                placeholder="Any additional feedback or suggestions..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
