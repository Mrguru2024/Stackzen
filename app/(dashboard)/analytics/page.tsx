import React from 'react';
import { Metadata } from 'next';
import { AnalyticsTimeRangeClient } from '@/components/analytics/AnalyticsTimeRangeClient';

export const metadata: Metadata = {
  title: 'Analytics - StackZen',
  description: 'Your income, clients, and invoices — plus optional mentorship stats for mentors.',
};

export default function AnalyticsPage() {
  return <AnalyticsTimeRangeClient initialTimeRange="30d" />;
}
