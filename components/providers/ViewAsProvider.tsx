'use client';

import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type SessionContextValue = ReturnType<typeof useSession>;

const _ViewAsContext = createContext<SessionContextValue | undefined>(undefined);

const _getOverride = viewAs => {
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

export function ViewAsProvider({ children }) {
  const { data: session, ...rest } = useSession();
  const [viewAs, setViewAs] = useState('REAL');
  const [overriddenSession, setOverriddenSession] = useState(session);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const _saved = localStorage.getItem('superadmin_viewas') || 'REAL';
      setViewAs(_saved);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN' && viewAs !== 'REAL') {
      const _override = _getOverride(viewAs);
      if (_override) {
        setOverriddenSession({
          ...session,
          user: {
            ...session.user,
            ..._override,
          },
        });
        return;
      }
    }
    setOverriddenSession(session);
  }, [session, viewAs]);

  return (
    <_ViewAsContext.Provider value={{ data: overriddenSession, ...rest }}>
      {children}
    </_ViewAsContext.Provider>
  );
}

export function useViewAsSession(): SessionContextValue {
  const value = useContext(_ViewAsContext);
  if (value !== undefined) return value;
  return {
    data: null,
    status: 'loading',
    update: async () => null,
  } as SessionContextValue;
}
