'use client';

import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type SessionContextValue = ReturnType<typeof useSession>;

type ViewAsMode = 'REAL' | 'TRIAL' | 'PRO' | 'MENTOR';

const ViewAsContext = createContext<SessionContextValue | undefined>(undefined);

const getOverride = (viewAs: ViewAsMode | string) => {
  switch (viewAs) {
    case 'TRIAL':
      return { subscriptionLevel: 'FREE', isTrialActive: true, role: 'USER' };
    case 'PRO':
      return { subscriptionLevel: 'PRO', isTrialActive: false, role: 'USER' };
    case 'MENTOR':
      return { subscriptionLevel: 'PRO', isTrialActive: false, role: 'MENTOR' };
    default:
      return null;
  }
};

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, ...rest } = useSession();
  const [viewAs, setViewAs] = useState<string>('REAL');
  const [overriddenSession, setOverriddenSession] = useState<Session | null>(session ?? null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('superadmin_viewas') || 'REAL';
      setViewAs(saved);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN' && viewAs !== 'REAL') {
      const override = getOverride(viewAs);
      if (override) {
        setOverriddenSession({
          ...session,
          user: {
            ...session.user,
            ...override,
          },
        });
        return;
      }
    }
    setOverriddenSession(session);
  }, [session, viewAs]);

  return (
    <ViewAsContext.Provider value={{ ...rest, data: overriddenSession } as SessionContextValue}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAsSession(): SessionContextValue {
  const value = useContext(ViewAsContext);
  if (value !== undefined) return value;
  return {
    data: null,
    status: 'loading',
    update: async () => null,
  } as SessionContextValue;
}
