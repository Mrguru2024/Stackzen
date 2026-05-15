import { SubscriptionLevel } from '@prisma/client';

export function hasAdvancedAutomationAccess(subscriptionLevel?: SubscriptionLevel | null): boolean {
  return (
    subscriptionLevel === SubscriptionLevel.PRO ||
    subscriptionLevel === SubscriptionLevel.LIFETIME ||
    subscriptionLevel === SubscriptionLevel.ZEN_PLUS
  );
}

export type AllocationPresetId = 'FIFTY_THIRTY_TWENTY' | 'FORTY_THIRTY_THIRTY';

/**
 * The only allocation split a free-tier account is allowed to run. Every other
 * preset (40/30/30) and every custom percentage scheme is premium-gated. Keeping
 * a single canonical free preset prevents free accounts from quietly persisting
 * "customized" budgets.
 */
export const FREE_TIER_CANONICAL_PRESET_ID: AllocationPresetId = 'FIFTY_THIRTY_TWENTY';

/** Presets selectable by Pro accounts. Free accounts always resolve to the canonical preset. */
export const ALLOCATION_FREE_PRESETS: Record<
  AllocationPresetId,
  readonly { bucket: string; percent: number }[]
> = {
  FIFTY_THIRTY_TWENTY: [
    { bucket: 'needs', percent: 50 },
    { bucket: 'wants', percent: 30 },
    { bucket: 'savings', percent: 20 },
  ],
  FORTY_THIRTY_THIRTY: [
    { bucket: 'needs', percent: 40 },
    { bucket: 'wants', percent: 30 },
    { bucket: 'savings', percent: 30 },
  ],
};

export function getDefaultAllocationActions() {
  return [...ALLOCATION_FREE_PRESETS[FREE_TIER_CANONICAL_PRESET_ID]];
}

export function getFortyThirtyThirtyAllocationActions() {
  return [...ALLOCATION_FREE_PRESETS.FORTY_THIRTY_THIRTY];
}

/**
 * Returns the actions for a requested preset id. If a non-premium caller asks for
 * anything other than the canonical free preset, the helper coerces back to the
 * canonical preset rather than silently elevating the account.
 */
export function resolveFreeAllocationPreset(preset?: AllocationPresetId | null) {
  const id = preset ?? FREE_TIER_CANONICAL_PRESET_ID;
  return [...ALLOCATION_FREE_PRESETS[id]];
}

/** True only when actions exactly match the canonical free preset. */
export function isFreeTierAllocationPreset(actions: Array<{ bucket: string; percent: number }>): boolean {
  const canonical = stringifyAllocationActions([...ALLOCATION_FREE_PRESETS[FREE_TIER_CANONICAL_PRESET_ID]]);
  return stringifyAllocationActions(actions) === canonical;
}

function stringifyAllocationActions(actions: Array<{ bucket: string; percent: number }>) {
  return JSON.stringify(
    [...actions.map(a => ({ bucket: a.bucket.toLowerCase(), percent: Number(a.percent) }))].sort((a, b) =>
      a.bucket.localeCompare(b.bucket)
    )
  );
}
