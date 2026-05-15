import type { Metadata } from 'next';
import JobsHub from '@/components/JobsHub';

export const metadata: Metadata = {
  title: 'Jobs | StackZen',
  description: 'View, filter, and export your job pipeline from any device.',
};

export default function JobsPage() {
  return <JobsHub />;
}
