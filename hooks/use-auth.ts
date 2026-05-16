'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  subscription?: {
    status: 'active' | 'inactive' | 'cancelled';
    plan: 'free' | 'pro';
    expiresAt?: string;
  };
}

export function useAuth() {
  const { data: session, status } = useSession();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    },
    enabled: status === 'authenticated',
  });

  return {
    user: user || null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
