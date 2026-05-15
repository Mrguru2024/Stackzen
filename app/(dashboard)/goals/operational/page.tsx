import OperationalGoalsCenter from '@/components/goals/OperationalGoalsCenter';

export const metadata = {
  title: 'Operational Goals · StackZen',
  description: 'Forecast-aware operational goals linked to SmartBuckets, allocations, and the attention queue.',
};

export default function OperationalGoalsPage() {
  return (
    <div className="container max-w-6xl py-8">
      <OperationalGoalsCenter />
    </div>
  );
}
