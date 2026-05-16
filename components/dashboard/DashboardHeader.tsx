import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ViewAsSwitcher } from './ViewAsSwitcher';
import { useSession } from 'next-auth/react';

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * Dashboard header component with title and optional subtitle
 */
export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const realRole = session?.user?.role || 'user';

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
          {children && <div className="flex items-center space-x-2">{children}</div>}
          <ViewAsSwitcher realRole={realRole} />
        </div>
      </CardContent>
    </Card>
  );
}
