import { useState, useCallback } from 'react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'podcast';
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  url: string;
}

export function useFinancialEducation() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-education');

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch resources'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchResources = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/financial-education/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search resources');
      }

      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search resources'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterResources = useCallback(async (type?: string, level?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (level) params.append('level', level);

      const response = await fetch(`/api/financial-education/filter?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to filter resources');
      }

      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to filter resources'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    resources,
    isLoading,
    error,
    fetchResources,
    searchResources,
    filterResources,
  };
}
