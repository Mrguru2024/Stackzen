import React from 'react';
import { Metadata } from 'next';
import MentorDashboard from '@/components/mentors/MentorDashboard';

export const metadata: Metadata = {
  title: 'Mentor Dashboard - StackZen',
  description: 'Manage your mentoring sessions, earnings, and client relationships.',
};

export default function MentorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Track your sessions, earnings, and help your mentees achieve their financial goals.
        </p>
      </div>

      <MentorDashboard />
    </div>
  );
}
