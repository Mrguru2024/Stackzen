'use client';

import { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import { useSession } from 'next-auth/react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  // Determine userTier from session
  const userTier =
    session?.user?.subscriptionLevel === 'PRO' || session?.user?.role === 'ADMIN' ? 'PRO' : 'FREE';
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userTier={userTier} session={session} />
      <div className="flex min-h-screen flex-1 flex-col pl-16 transition-all duration-200 ease-in-out md:pl-64">
        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
