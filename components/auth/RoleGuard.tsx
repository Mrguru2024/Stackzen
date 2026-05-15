'use client';

import React from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!allowedRoles.includes(session.user?.role || '')) {
      router.push('/');
    }
  }, [session, status, allowedRoles, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || !allowedRoles.includes(session.user?.role || '')) {
    return null;
  }

  return <>{children}</>;
}
