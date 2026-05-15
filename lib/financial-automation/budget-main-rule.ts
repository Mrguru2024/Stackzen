/** Matches the primary income auto-split rule managed by `/api/automation/budget-breakdown`. */
export const BUDGET_MAIN_CONDITION_KEY = 'budgetMain' as const;

export const BUDGET_MAIN_RULE_NAME = 'Budget breakdown';

export function isBudgetMainAutomationConditions(conditions: unknown): boolean {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return false;
  return Boolean((conditions as Record<string, unknown>)[BUDGET_MAIN_CONDITION_KEY]);
}
