import type { Metadata } from 'next';
import JobDetail from '@/components/JobDetail';

export const metadata: Metadata = {
  title: 'Job detail | StackZen',
  description: 'Job summary, linked records, and downloads.',
};

export default function JobDetailPage() {
  return <JobDetail />;
}
