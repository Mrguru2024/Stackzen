'use client';

import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WellnessScorecard } from '@/components/wellness/scorecard/WellnessScorecard';
import { CategoryTrends } from '@/components/wellness/category-trends/CategoryTrends';
import CategoryGoals from '@/components/wellness/category-goals/CategoryGoals';
import { GoalNotifications } from '@/components/wellness/notifications/GoalNotifications';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import type { CategoryGoal, Recommendation, WellnessScore } from '@/lib/types/wellness';

type WellnessDashboardScore = WellnessScore & { recommendations: Recommendation[] };

interface WellnessData {
  latestScore: WellnessDashboardScore;
  goals: CategoryGoal[];
}

type ApiWellnessResponse = {
  score: null | {
    totalScore: number;
    status: string;
    color: string;
    description: string;
    categoryScores: unknown;
    recommendations: unknown;
    timestamp: string;
  };
  goals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    deadline: string;
    category: string;
    status: string;
  }>;
};

function mapWellnessPayload(body: ApiWellnessResponse): WellnessData | null {
  if (!body.score) return null;

  const recommendations = Array.isArray(body.score.recommendations)
    ? (body.score.recommendations as Recommendation[])
    : [];

  return {
    latestScore: {
      totalScore: body.score.totalScore,
      status: body.score.status as WellnessScore['status'],
      color: body.score.color,
      description: body.score.description,
      categoryScores: body.score.categoryScores as WellnessScore['categoryScores'],
      timestamp: body.score.timestamp,
      recommendations,
    },
    goals: (body.goals ?? []).map(g => ({
      id: g.id,
      category: g.category,
      name: g.name,
      target: g.target,
      current: g.current,
      deadline: g.deadline,
    })),
  };
}

export default function WellnessPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [dismissedGoals, setDismissedGoals] = useState<Set<string>>(new Set());

  // Fetch wellness data
  const { data: wellnessData, isLoading: isLoadingWellness } = useQuery<WellnessData | null>({
    queryKey: ['wellness'],
    queryFn: async () => {
      const response = await fetch('/api/wellness');
      if (!response.ok) throw new Error('Failed to fetch wellness data');
      const body = (await response.json()) as ApiWellnessResponse;
      return mapWellnessPayload(body);
    },
  });

  // Fetch historical scores
  const { data: scores, isLoading: isLoadingScores } = useQuery<WellnessScore[]>({
    queryKey: ['wellness-scores'],
    queryFn: async () => {
      const response = await fetch('/api/wellness/scores');
      if (!response.ok) throw new Error('Failed to fetch wellness scores');
      return response.json();
    },
  });

  const handleAddGoal = async (goal: Omit<CategoryGoal, 'id'>) => {
    try {
      const response = await fetch('/api/wellness/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });

      if (!response.ok) throw new Error('Failed to add goal');

      await queryClient.invalidateQueries({ queryKey: ['wellness'] });
      toast({
        title: 'Goal Added',
        description: 'Your new financial goal has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateGoal = async (goal: CategoryGoal) => {
    try {
      const response = await fetch(`/api/wellness/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      await queryClient.invalidateQueries({ queryKey: ['wellness'] });
      toast({
        title: 'Goal Updated',
        description: 'Your financial goal has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/wellness/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      await queryClient.invalidateQueries({ queryKey: ['wellness'] });
      toast({
        title: 'Goal Deleted',
        description: 'Your financial goal has been removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDismissNotification = (goalId: string) => {
    setDismissedGoals(prev => new Set([...prev, goalId]));
  };

  if (isLoadingWellness || isLoadingScores) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wellnessData || !scores) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold">No Data Available</h2>
          <p className="text-muted-foreground">
            Please complete your financial assessment to view your wellness dashboard.
          </p>
        </Card>
      </div>
    );
  }

  // Filter out dismissed goals
  const activeGoals = wellnessData.goals.filter(goal => !dismissedGoals.has(goal.id));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Wellness</h1>
            <p className="mt-1 text-muted-foreground">Track your financial health and progress</p>
          </div>
          <Button onClick={() => setShowGoalForm(true)} className="bg-primary hover:bg-primary/90">
            Add New Goal
          </Button>
        </div>

        {/* Notifications */}
        <GoalNotifications goals={activeGoals} onDismiss={handleDismissNotification} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <WellnessScorecard
              score={wellnessData.latestScore.totalScore}
              category={wellnessData.latestScore.status}
              description={wellnessData.latestScore.description}
            />
            <CategoryTrends scores={scores} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <CategoryGoals
              scores={scores}
              goals={activeGoals}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />

            {/* Recommendations Section */}
            {wellnessData.latestScore.recommendations.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Recommendations</h3>
                <div className="space-y-4">
                  {wellnessData.latestScore.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div
                        className={`mt-2 h-2 w-2 rounded-full ${
                          rec.priority === 'high'
                            ? 'bg-red-500'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
