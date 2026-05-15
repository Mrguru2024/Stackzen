/**
 * Dashboard widget registry.
 *
 * Centralised list of every renderable card on the dashboard. The customize
 * panel and the layout hook both read from this source of truth so adding a
 * new widget only requires registering it here.
 */

import React from 'react';

export type DashboardWidgetCategory =
  | 'overview'
  | 'cashflow'
  | 'goals'
  | 'work'
  | 'wellness'
  | 'mentor';

export interface DashboardWidgetDefinition {
  /** Stable identifier persisted in user layouts. Never rename. */
  id: string;
  /** Short label shown in the customize panel. */
  title: string;
  /** One-line description shown alongside the toggle. */
  description: string;
  /** Group used to organise the customize panel. */
  category: DashboardWidgetCategory;
  /** Display in the dashboard by default. */
  defaultVisible: boolean;
  /** Default position relative to other widgets (lower = higher on the page). */
  defaultOrder: number;
  /** Optional role gate. Widget is hidden entirely when the role doesn't match. */
  roleGate?: 'MENTOR' | 'ADMIN';
  /** Render function — components import lazily inside to avoid hot-path cost. */
  Component: React.ComponentType;
}

import KpiStrip from '@/components/dashboard/widgets/KpiStrip';
import OperationalAlertsMini from '@/components/dashboard/widgets/OperationalAlertsMini';
import CashFlowSnapshot from '@/components/dashboard/widgets/CashFlowSnapshot';
import GoalsProgressMini from '@/components/dashboard/widgets/GoalsProgressMini';
import IncomeHealthMini from '@/components/dashboard/widgets/IncomeHealthMini';
import SafeToSpend from '@/components/SafeToSpend';
import FinancialActivityWidget from '@/components/financial-events/FinancialActivityWidget';
import IncomeTimeline from '@/components/IncomeTimeline';
import EmotionalState from '@/components/EmotionalState';
import JobBasedIncome from '@/components/JobBasedIncome';
import ProjectForecast from '@/components/ProjectForecast';
import MentorDashboard from '@/components/MentorDashboard';

export const DASHBOARD_WIDGETS: ReadonlyArray<DashboardWidgetDefinition> = [
  {
    id: 'kpi-strip',
    title: 'Key numbers',
    description: 'Income this month, expected next 30 days, runway, and attention queue count.',
    category: 'overview',
    defaultVisible: true,
    defaultOrder: 10,
    Component: KpiStrip,
  },
  {
    id: 'operational-alerts',
    title: 'Needs attention',
    description: 'Top operational alerts grouped from cashflow, income, allocations, and invoices.',
    category: 'overview',
    defaultVisible: true,
    defaultOrder: 20,
    Component: OperationalAlertsMini,
  },
  {
    id: 'cashflow-snapshot',
    title: 'Cash flow outlook',
    description: 'Projected balance for the next 7 / 14 / 30 days with risk flags.',
    category: 'cashflow',
    defaultVisible: true,
    defaultOrder: 30,
    Component: CashFlowSnapshot,
  },
  {
    id: 'goals-progress',
    title: 'Goals progress',
    description: 'Active operational goals with progress and projected completion.',
    category: 'goals',
    defaultVisible: true,
    defaultOrder: 40,
    Component: GoalsProgressMini,
  },
  {
    id: 'income-health',
    title: 'Income health',
    description: 'Concentration, irregular cadence, and delayed deposit signals.',
    category: 'cashflow',
    defaultVisible: true,
    defaultOrder: 50,
    Component: IncomeHealthMini,
  },
  {
    id: 'safe-to-spend',
    title: 'Safe to spend',
    description: 'Discretionary spend buffer after committed bills and savings goals.',
    category: 'cashflow',
    defaultVisible: true,
    defaultOrder: 60,
    Component: SafeToSpend,
  },
  {
    id: 'financial-activity',
    title: 'Activity feed',
    description: 'Latest automation, transaction, and goal events.',
    category: 'overview',
    defaultVisible: true,
    defaultOrder: 70,
    Component: FinancialActivityWidget,
  },
  {
    id: 'income-timeline',
    title: 'Income timeline',
    description: 'Visual timeline of recent income events.',
    category: 'cashflow',
    defaultVisible: false,
    defaultOrder: 80,
    Component: IncomeTimeline,
  },
  {
    id: 'emotional-state',
    title: 'Money pulse',
    description: 'Quick check-in on how money feels right now.',
    category: 'wellness',
    defaultVisible: false,
    defaultOrder: 90,
    Component: EmotionalState,
  },
  {
    id: 'job-based-income',
    title: 'Job-based income',
    description: 'Earnings by active jobs and bookings.',
    category: 'work',
    defaultVisible: false,
    defaultOrder: 100,
    Component: JobBasedIncome,
  },
  {
    id: 'project-forecast',
    title: 'Project forecast',
    description: 'Forward-looking project earnings and milestones.',
    category: 'work',
    defaultVisible: false,
    defaultOrder: 110,
    Component: ProjectForecast,
  },
  {
    id: 'mentor-dashboard',
    title: 'Mentor view',
    description: 'Mentees, sessions, and earnings — only visible to mentors.',
    category: 'mentor',
    defaultVisible: true,
    defaultOrder: 120,
    roleGate: 'MENTOR',
    Component: MentorDashboard,
  },
] as const;

export const DASHBOARD_WIDGET_IDS = DASHBOARD_WIDGETS.map(w => w.id) as ReadonlyArray<string>;

export function getWidgetDefinition(id: string): DashboardWidgetDefinition | null {
  return DASHBOARD_WIDGETS.find(w => w.id === id) ?? null;
}
