import React from 'react';
import { Metadata } from 'next';
import { Sidebar } from '@/components/sidebar';
import { TrialBanner } from '@/components/trial/trial-banner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import QueryClientProviderWrapper from '@/components/QueryClientProviderWrapper';
import { ViewAsProvider } from '@/components/providers/ViewAsProvider';

export const metadata: Metadata = {
  title: 'StackZen - Financial Wellness Platform',
  description: 'Your AI-powered financial wellness companion',
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  const userTier = session?.user?.subscriptionLevel === 'PRO' ? 'PRO' : 'FREE';

  return (
    <QueryClientProviderWrapper>
      <ViewAsProvider>
        <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-[100vw] flex-col bg-background md:flex-row">
          <Sidebar userTier={userTier} session={session} />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
            <div className="min-h-0 min-w-0 flex-1 pt-[max(4rem,calc(env(safe-area-inset-top,0px)+3.25rem))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pt-0 md:pb-0">
              {/* Trial Banner */}
              <div className="mb-4 px-1 sm:mb-6 sm:px-0">
                <TrialBanner />
              </div>
              <div className="mx-auto w-full min-w-0 max-w-7xl px-3 xs:px-4 sm:px-6 lg:px-8">{children}</div>
            </div>
          </main>
        </div>
      </ViewAsProvider>
    </QueryClientProviderWrapper>
  );
}
