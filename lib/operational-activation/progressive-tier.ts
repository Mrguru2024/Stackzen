import type { DerivedActivationSteps } from '@/lib/operational-activation/types';

/** 0 = foundations, 3 = full operational loop engaged (see architecture doc). */
export function computeProgressiveTier(derived: DerivedActivationSteps): number {
  const { income_profile_selected, bank_linked, ledger_populated } = derived;
  if (!income_profile_selected || !bank_linked || !ledger_populated) return 0;

  const { transactions_categorized, envelopes_or_automation } = derived;
  if (!transactions_categorized || !envelopes_or_automation) return 1;

  const { forecast_engaged, operational_goal_created } = derived;
  if (!forecast_engaged || !operational_goal_created) return 2;

  return derived.attention_queue_engaged ? 3 : 2;
}
