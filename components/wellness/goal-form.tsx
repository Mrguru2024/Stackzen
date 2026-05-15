'use client';

import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import { motion } from 'framer-motion'; // Unused
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FinancialGoal } from '@/lib/types/wellness';
// const data = ... // Unused

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  target: z.number().min(0, 'Target must be positive'),
  current: z.number().min(0, 'Current amount must be positive'),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'completed', 'abandoned']),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  initialData?: FinancialGoal;
}

export default function GoalForm({ isOpen, onClose, onSubmit, initialData }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          target: initialData.target,
          current: initialData.current,
          deadline: new Date(initialData.deadline).toISOString().split('T')[0],
          category: initialData.category,
          status: initialData.status,
        }
      : {
          status: 'active',
        },
  });

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Financial Goal' : 'Add Financial Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Emergency Fund" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Amount</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                {...register('target', { valueAsNumber: true })}
              />
              {errors.target && <p className="text-sm text-red-500">{errors.target.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Amount</Label>
              <Input
                id="current"
                type="number"
                step="0.01"
                {...register('current', { valueAsNumber: true })}
              />
              {errors.current && <p className="text-sm text-red-500">{errors.current.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date</Label>
            <Input id="deadline" type="date" {...register('deadline')} />
            {errors.deadline && <p className="text-sm text-red-500">{errors.deadline.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" {...register('category')}>
              <option value="">Select a category</option>
              <option value="savings">Savings</option>
              <option value="investments">Investments</option>
              <option value="debt">Debt Payoff</option>
              <option value="purchase">Major Purchase</option>
              <option value="other">Other</option>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register('status')}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Goal' : 'Add Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
