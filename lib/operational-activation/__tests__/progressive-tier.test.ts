import { computeProgressiveTier } from '@/lib/operational-activation/progressive-tier';
import type { DerivedActivationSteps } from '@/lib/operational-activation/types';

const baseEvidence = {
  transactionCount: 0,
  categorizedCount: 0,
  activeIncomeProfileCount: 0,
  activeBankConnectionCount: 0,
  enabledAutomationRuleCount: 0,
  smartAllocationCount: 0,
  operationalGoalCount: 0,
  cashflowFinancialEventCount: 0,
  readNotificationCount: 0,
};

function fill(partial: Partial<DerivedActivationSteps>): DerivedActivationSteps {
  return {
    income_profile_selected: false,
    bank_linked: false,
    ledger_populated: false,
    transactions_categorized: false,
    envelopes_or_automation: false,
    forecast_engaged: false,
    operational_goal_created: false,
    attention_queue_engaged: false,
    evidence: baseEvidence,
    ...partial,
  };
}

describe('computeProgressiveTier', () => {
  it('returns 0 without foundations', () => {
    expect(computeProgressiveTier(fill({ income_profile_selected: true }))).toBe(0);
  });

  it('returns 1 when foundations done but categorization incomplete', () => {
    expect(
      computeProgressiveTier(
        fill({
          income_profile_selected: true,
          bank_linked: true,
          ledger_populated: true,
          transactions_categorized: false,
          envelopes_or_automation: true,
        })
      )
    ).toBe(1);
  });

  it('returns 3 when full loop including attention', () => {
    expect(
      computeProgressiveTier(
        fill({
          income_profile_selected: true,
          bank_linked: true,
          ledger_populated: true,
          transactions_categorized: true,
          envelopes_or_automation: true,
          forecast_engaged: true,
          operational_goal_created: true,
          attention_queue_engaged: true,
        })
      )
    ).toBe(3);
  });
});
