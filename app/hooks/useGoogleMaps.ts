import { useState, useEffect } from 'react';

interface UseGoogleMapsResult {
  isLoaded: boolean;
  hasError: boolean;
  error: Error | null;
}

export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const handleLoad = () => {
      setIsLoaded(true);
      setHasError(false);
      setError(null);
    };

    const handleError = (e: Event) => {
      setHasError(true);
      setError(new Error('Failed to load Google Maps'));
      console.error('Google Maps loading error:', e);
    };

    // Listen for custom events
    window.addEventListener('google-maps-loaded', handleLoad);
    window.addEventListener('google-maps-error', handleError);

    return () => {
      window.removeEventListener('google-maps-loaded', handleLoad);
      window.removeEventListener('google-maps-error', handleError);
    };
  }, []);

  return { isLoaded, hasError, error };
}
