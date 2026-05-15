import { AutomationNotificationType } from '@prisma/client';

/** Smart bucket type for auto-provisioned goal funds. */
export const GOAL_FUND_BUCKET_TYPE = 'GOAL_FUND';

/** Goal-derived notification types tied to deterministic goal analysis; cleared when goals leave ACTIVE or findings change. */
export const DERIVED_GOAL_NOTIFICATION_TYPES = new Set<AutomationNotificationType>([
  AutomationNotificationType.GOAL_PACE_WARNING,
  AutomationNotificationType.GOAL_UNSAFE_CONTRIBUTION,
  AutomationNotificationType.GOAL_FORECAST_CONFLICT,
]);

/** Prefix for SmartAllocation.source — idempotent aggregation per goal. */
export function goalAllocationSource(goalId: string): string {
  return `OPERATIONAL_GOAL:${goalId}`;
}

export function parseGoalIdFromAllocationSource(source: string): string | null {
  if (!source.startsWith('OPERATIONAL_GOAL:')) return null;
  const id = source.slice('OPERATIONAL_GOAL:'.length).trim();
  return id || null;
}
