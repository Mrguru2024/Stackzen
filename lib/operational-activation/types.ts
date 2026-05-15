import type { IncomeProfileType } from '@prisma/client';

/** Stable keys for derivation, dismissals, and milestone emission. */
export type OperationalActivationStepKey =
  | 'income_profile_selected'
  | 'bank_linked'
  | 'ledger_populated'
  | 'transactions_categorized'
  | 'envelopes_or_automation'
  | 'forecast_engaged'
  | 'operational_goal_created'
  | 'attention_queue_engaged';

export interface DerivedActivationSteps {
  income_profile_selected: boolean;
  bank_linked: boolean;
  ledger_populated: boolean;
  transactions_categorized: boolean;
  envelopes_or_automation: boolean;
  forecast_engaged: boolean;
  operational_goal_created: boolean;
  attention_queue_engaged: boolean;
  evidence: {
    transactionCount: number;
    categorizedCount: number;
    activeIncomeProfileCount: number;
    activeBankConnectionCount: number;
    enabledAutomationRuleCount: number;
    smartAllocationCount: number;
    operationalGoalCount: number;
    cashflowFinancialEventCount: number;
    readNotificationCount: number;
  };
}

export interface AdaptiveNextAction {
  key: string;
  priority: number;
  title: string;
  body: string;
  href: string;
}

export interface AdaptiveActivationResponseDto {
  derivedSteps: DerivedActivationSteps;
  progressiveTier: number;
  nextActions: AdaptiveNextAction[];
  checkpointActivation: {
    dismissedNbaKeys: string[];
    milestoneEventsEmitted: string[];
  };
  incomeProfileTypes: IncomeProfileType[];
}
