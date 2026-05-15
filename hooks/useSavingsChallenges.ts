import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  participants: number;
  type: 'personal' | 'group';
  category: 'emergency' | 'vacation' | 'education' | 'home' | 'other';
  status: 'active' | 'completed' | 'upcoming';
}

interface CreateChallengeInput {
  title: string;
  description: string;
  targetAmount: number;
  startDate: Date;
  endDate: Date;
  type: 'personal' | 'group';
  category: 'emergency' | 'vacation' | 'education' | 'home' | 'other';
}

export function useSavingsChallenges() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenges() {
      if (!session?.user) return;

      setLoading(true);
      try {
        const response = await fetch('/api/savings-challenges');
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const data = await response.json();
        setChallenges(data.challenges);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, [session]);

  const createChallenge = async (input: CreateChallengeInput) => {
    if (!session?.user) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/savings-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create challenge');
      }

      const newChallenge = await response.json();
      setChallenges(prev => [...prev, newChallenge]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (challengeId: string, amount: number) => {
    if (!session?.user) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/savings-challenges/${challengeId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const updatedChallenge = await response.json();
      setChallenges(prev =>
        prev.map(challenge => (challenge.id === challengeId ? updatedChallenge : challenge))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!session?.user) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/savings-challenges/${challengeId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join challenge');
      }

      const updatedChallenge = await response.json();
      setChallenges(prev =>
        prev.map(challenge => (challenge.id === challengeId ? updatedChallenge : challenge))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    challenges,
    loading,
    error,
    createChallenge,
    updateProgress,
    joinChallenge,
  };
}
