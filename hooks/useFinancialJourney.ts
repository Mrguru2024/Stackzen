import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  criteria: string;
  tip: string;
  completed: boolean;
  completionPercentage: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Date;
}

interface FinancialJourneyData {
  milestones: Milestone[];
  achievements: Achievement[];
}

export function useFinancialJourney() {
  const { data: session } = useSession();
  const [data, setData] = useState<FinancialJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/financial-journey');

        if (!response.ok) {
          throw new Error('Failed to fetch financial journey data');
        }

        const data = await response.json();
        setData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session]);

  const updateMilestone = async (
    milestoneId: string,
    completed: boolean,
    completionPercentage: number
  ) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/financial-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId,
          completed,
          completionPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      // Update local state
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          milestones: prev.milestones.map(milestone =>
            milestone.id === milestoneId
              ? { ...milestone, completed, completionPercentage }
              : milestone
          ),
        };
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  return {
    data,
    loading,
    error,
    updateMilestone,
  };
}
