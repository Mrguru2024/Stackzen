import { render, screen, waitFor } from '@testing-library/react';
import OperationalActivationPanel from './index';
import type { AdaptiveActivationResponseDto } from '@/lib/operational-activation/types';

const mockDto: AdaptiveActivationResponseDto = {
  derivedSteps: {
    income_profile_selected: true,
    bank_linked: false,
    ledger_populated: false,
    transactions_categorized: false,
    envelopes_or_automation: false,
    forecast_engaged: false,
    operational_goal_created: false,
    attention_queue_engaged: false,
    evidence: {
      transactionCount: 0,
      categorizedCount: 0,
      activeIncomeProfileCount: 1,
      activeBankConnectionCount: 0,
      enabledAutomationRuleCount: 0,
      smartAllocationCount: 0,
      operationalGoalCount: 0,
      cashflowFinancialEventCount: 0,
      readNotificationCount: 0,
    },
  },
  progressiveTier: 0,
  nextActions: [
    {
      key: 'nba_connect_bank',
      priority: 20,
      title: 'Connect a bank feed',
      body: 'Test',
      href: '/money-control?tab=review',
    },
  ],
  checkpointActivation: { dismissedNbaKeys: [], milestoneEventsEmitted: [] },
  incomeProfileTypes: ['PAYCHECK'],
};

describe('OperationalActivationPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDto,
    } as Response);
  });

  it('renders checklist after load', async () => {
    render(<OperationalActivationPanel />);
    await waitFor(() => {
      expect(screen.getByText('Bank connection active')).toBeInTheDocument();
    });
    expect(screen.getByText('Connect a bank feed')).toBeInTheDocument();
  });
});
