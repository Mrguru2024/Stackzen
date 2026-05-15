import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Mentor {
  id: string;
  name: string;
  specialization: string;
  avatar?: string;
  rating: number;
  sessionsCompleted: number;
  studentsHelped: number;
  bio: string;
  expertise: string[];
}

interface BookingSession {
  mentorId: string;
  date: string;
  time: string;
}

interface FinancialMentorshipData {
  mentors: Mentor[];
  availableTimeSlots: string[];
  upcomingSessions: {
    id: string;
    mentorId: string;
    date: string;
    time: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
}

export function useFinancialMentorship() {
  const { data: session } = useSession();
  const [data, setData] = useState<FinancialMentorshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/financial-mentorship');

        if (!response.ok) {
          throw new Error('Failed to fetch mentorship data');
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

  const bookSession = async (booking: BookingSession) => {
    if (!session?.user) return false;

    try {
      const response = await fetch('/api/financial-mentorship/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        throw new Error('Failed to book session');
      }

      // Update local state with the new booking
      const _newBooking = await response.json();
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          upcomingSessions: [...prev.upcomingSessions, _newBooking],
        };
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const cancelSession = async (sessionId: string) => {
    if (!session?.user) return false;

    try {
      const response = await fetch(`/api/financial-mentorship/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel session');
      }

      // Update local state
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          upcomingSessions: prev.upcomingSessions.filter(session => session.id !== sessionId),
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
    bookSession,
    cancelSession,
  };
}
