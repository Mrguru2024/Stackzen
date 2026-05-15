import { useState, useCallback } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  reward: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  category: string;
}

export function useFinancialChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const joinChallenge = useCallback(async (challengeId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/financial-challenges/${challengeId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join challenge');
      }

      const updatedChallenge = await response.json();
      setChallenges(prev => prev.map(c => (c.id === challengeId ? updatedChallenge : c)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to join challenge'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (challengeId: string, progress: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/financial-challenges/${challengeId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const updatedChallenge = await response.json();
      setChallenges(prev => prev.map(c => (c.id === challengeId ? updatedChallenge : c)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update progress'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChallenges = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-challenges');

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch challenges'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    challenges,
    isLoading,
    error,
    joinChallenge,
    updateProgress,
    fetchChallenges,
  };
}
