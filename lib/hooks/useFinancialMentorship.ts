import { useState, useCallback } from 'react';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  availability: string;
  imageUrl?: string;
}

export function useFinancialMentorship() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connectWithMentor = useCallback(async (mentorId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/financial-mentorship/${mentorId}/connect`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to connect with mentor');
      }

      // Handle successful connection
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect with mentor'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMentors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-mentorship');

      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }

      const data = await response.json();
      setMentors(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch mentors'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMentors = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/financial-mentorship/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search mentors');
      }

      const data = await response.json();
      setMentors(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search mentors'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    mentors,
    isLoading,
    error,
    connectWithMentor,
    fetchMentors,
    searchMentors,
  };
}
