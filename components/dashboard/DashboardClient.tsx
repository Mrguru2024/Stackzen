'use client';

import React from 'react';
import { useViewAsSession } from '@/components/providers/ViewAsProvider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ErrorBoundary } from '@/components/error-boundary';
import CustomizePanel from './CustomizePanel';
import {
  resolveVisibleWidgets,
  useDashboardLayout,
} from '@/lib/dashboard/use-dashboard-layout';

function WidgetSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-lg border bg-card" aria-hidden="true" />
  );
}

export default function DashboardClient() {
  const viewAsSession: any = useViewAsSession();
  const session = viewAsSession?.data;
  const status = viewAsSession?.status;
  const user = session?.user;
  const userRole = (user?.role ?? '').toString().toUpperCase();

  const { items, toggleWidget, moveWidget, reset, isReady, syncStatus } = useDashboardLayout();

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Please sign in to view your dashboard</div>
      </div>
    );
  }

  const visibleWidgets = isReady ? resolveVisibleWidgets(items, userRole) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name ?? 'there'}
        </h2>
        <div className="flex items-center gap-2">
          <CustomizePanel
            items={items}
            role={userRole}
            onToggle={toggleWidget}
            onMove={moveWidget}
            onReset={reset}
            syncStatus={syncStatus}
          />
          <ThemeToggle />
        </div>
      </div>

      {!isReady ? (
        <div className="space-y-4">
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      ) : visibleWidgets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your dashboard is empty. Click <strong>Customize</strong> to add widgets back.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleWidgets.map(widget => {
            const Component = widget.Component;
            return (
              <ErrorBoundary
                key={widget.id}
                fallback={
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Couldn’t render the <strong>{widget.title}</strong> widget. The rest of your dashboard
                    is still working.
                  </div>
                }
              >
                <section data-widget-id={widget.id} aria-label={widget.title}>
                  <Component />
                </section>
              </ErrorBoundary>
            );
          })}
        </div>
      )}
    </div>
  );
}
