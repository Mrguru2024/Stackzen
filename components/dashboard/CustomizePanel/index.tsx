'use client';

import React, { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowDown, ArrowUp, RotateCcw, Settings2 } from 'lucide-react';
import {
  DASHBOARD_WIDGETS,
  type DashboardWidgetCategory,
  type DashboardWidgetDefinition,
} from '@/lib/dashboard/widgets';
import type {
  DashboardLayoutItem,
  DashboardLayoutSyncStatus,
} from '@/lib/dashboard/use-dashboard-layout';
import { cn } from '@/lib/utils';

const CATEGORY_LABEL: Record<DashboardWidgetCategory, string> = {
  overview: 'Overview',
  cashflow: 'Cash flow',
  goals: 'Goals',
  work: 'Work & income',
  wellness: 'Wellness',
  mentor: 'Mentor',
};

interface CustomizePanelProps {
  items: DashboardLayoutItem[];
  role: string;
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onReset: () => void;
  syncStatus?: DashboardLayoutSyncStatus;
  /** Optional controlled open state for tests. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function syncStatusLabel(status: DashboardLayoutSyncStatus): { label: string; tone: string } {
  if (status === 'saving') return { label: 'Saving…', tone: 'text-muted-foreground' };
  if (status === 'saved') return { label: 'Saved to your account', tone: 'text-green-600 dark:text-green-400' };
  if (status === 'loading') return { label: 'Syncing layout…', tone: 'text-muted-foreground' };
  if (status === 'error')
    return {
      label: 'Couldn’t sync — changes saved locally',
      tone: 'text-amber-600 dark:text-amber-400',
    };
  return { label: 'Synced across your devices', tone: 'text-muted-foreground' };
}

interface RowProps {
  index: number;
  total: number;
  item: DashboardLayoutItem;
  def: DashboardWidgetDefinition;
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

function CustomizeRow({ index, total, item, def, onToggle, onMove }: RowProps) {
  return (
    <li className="flex items-start gap-3 rounded-md border bg-card p-3">
      <div className="flex flex-col gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          aria-label={`Move ${def.title} up`}
          disabled={index === 0}
          onClick={() => onMove(item.id, 'up')}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          aria-label={`Move ${def.title} down`}
          disabled={index === total - 1}
          onClick={() => onMove(item.id, 'down')}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{def.title}</p>
        <p className="text-xs text-muted-foreground">{def.description}</p>
      </div>
      <Switch
        checked={item.visible}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={`Toggle ${def.title}`}
      />
    </li>
  );
}

export default function CustomizePanel({
  items,
  role,
  onToggle,
  onMove,
  onReset,
  syncStatus = 'idle',
  open,
  onOpenChange,
}: CustomizePanelProps) {
  const known = useMemo(() => new Map(DASHBOARD_WIDGETS.map(w => [w.id, w])), []);
  const roleUpper = role.toUpperCase();

  const visibleItems = useMemo(() => {
    return items
      .map(item => ({ item, def: known.get(item.id) ?? null }))
      .filter(
        (entry): entry is { item: DashboardLayoutItem; def: DashboardWidgetDefinition } => {
          if (!entry.def) return false;
          if (entry.def.roleGate && entry.def.roleGate !== roleUpper) return false;
          return true;
        }
      );
  }, [items, known, roleUpper]);

  const visibleCount = visibleItems.filter(e => e.item.visible).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Customize your dashboard</SheetTitle>
          <SheetDescription>
            Toggle widgets on or off and reorder them. Your layout is saved to your account and
            syncs across devices.
          </SheetDescription>
        </SheetHeader>

        <div
          className={cn(
            'mt-3 text-xs',
            syncStatusLabel(syncStatus).tone
          )}
          aria-live="polite"
          data-testid="dashboard-layout-sync-status"
        >
          {syncStatusLabel(syncStatus).label}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{visibleCount}</strong> of {visibleItems.length} visible
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onReset}
            aria-label="Reset dashboard to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <ol className={cn('mt-4 space-y-2')} aria-label="Widgets">
          {visibleItems.map(({ item, def }, idx) => (
            <CustomizeRow
              key={item.id}
              index={idx}
              total={visibleItems.length}
              item={item}
              def={def}
              onToggle={onToggle}
              onMove={onMove}
            />
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
