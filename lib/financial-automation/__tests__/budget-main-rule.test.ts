import { isBudgetMainAutomationConditions } from '@/lib/financial-automation/budget-main-rule';

describe('isBudgetMainAutomationConditions', () => {
  it('returns true when budgetMain flag is set', () => {
    expect(isBudgetMainAutomationConditions({ budgetMain: true, directions: ['INFLOW'] })).toBe(true);
  });

  it('returns false for other rule shapes', () => {
    expect(isBudgetMainAutomationConditions(null)).toBe(false);
    expect(isBudgetMainAutomationConditions([])).toBe(false);
    expect(isBudgetMainAutomationConditions({ directions: ['INFLOW'] })).toBe(false);
  });
});
