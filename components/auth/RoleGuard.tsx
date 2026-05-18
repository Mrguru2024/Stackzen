'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@prisma/client';

/** Roles allowed by RoleGuard — Prisma `UserRole` plus legacy app aliases. */
export type RoleGuardRole = UserRole | 'developer';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RoleGuardRole[];
}

function normalizeRole(role: string | undefined): string {
  return (role ?? '').toUpperCase();
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const role = normalizeRole(session.user?.role);
    if (!normalizedAllowed.includes(role)) {
      router.push('/dashboard');
    }
  }, [session, status, normalizedAllowed, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const role = normalizeRole(session?.user?.role);
  if (!session || !normalizedAllowed.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
