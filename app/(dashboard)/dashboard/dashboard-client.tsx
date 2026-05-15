'use client';

import React from 'react';

import ProjectForecast from '@/components/ProjectForecast';
import SafeToSpend from '@/components/SafeToSpend';
import MentorDashboard from '@/components/MentorDashboard';
import EmotionalState from '@/components/EmotionalState';
import IncomeTimeline from '@/components/IncomeTimeline';
import JobBasedIncome from '@/components/JobBasedIncome';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useViewAsSession } from '@/components/providers/ViewAsProvider';

export function DashboardClient() {
  const { data: session, status } = useViewAsSession();

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Please sign in to view your dashboard</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 0. Welcome Header - Moved to top with enhanced padding with enhanced padding */}
      <div className="flex items-center justify-between pb-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name || 'User'}
        </h2>
        <ThemeToggle />
      </div>

      {/* 1. Emotional State Check-in */}
      <EmotionalState />

      {/* 2. Safe to Spend Overview */}
      <SafeToSpend />

      {/* 3. Income Timeline (recent income context) */}
      <IncomeTimeline />

      {/* 4. Job-Based Income Breakdown */}
      <JobBasedIncome />

      {/* 5. Project Forecasting */}
      <ProjectForecast />

      {/* 6. Mentor Dashboard (show only if user is mentor) */}
      <MentorDashboard />

      {/* 7. Main Dashboard Content (tables, lists, etc.) */}
    </div>
  );
}
