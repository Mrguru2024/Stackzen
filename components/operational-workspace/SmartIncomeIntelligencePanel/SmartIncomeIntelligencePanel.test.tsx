import { render, screen, waitFor } from '@testing-library/react';
import SmartIncomeIntelligencePanel from '@/components/operational-workspace/SmartIncomeIntelligencePanel';
import type { IncomeIntelligenceSnapshotDto } from '@/lib/income-intelligence/types';

const emptySnap: IncomeIntelligenceSnapshotDto = {
  generatedAt: new Date().toISOString(),
  lookbackDays: 120,
  recurringIncome: [],
  concentration: {
    windowDays: 90,
    totalInflowUsd: 0,
    herfindahlIndex: 0,
    topSources: [],
    reasoning: [],
  },
  delayedIncome: [],
  irregularPayouts: [],
  decliningPayouts: [],
  reserveNudges: [],
  forecastRiskCodes: [],
  explain: { assumptions: [], inputsUsed: {}, confidenceNotes: [] },
};

describe('SmartIncomeIntelligencePanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => emptySnap,
    } as Response);
  });

  it('renders headline after load', async () => {
    render(<SmartIncomeIntelligencePanel />);
    expect(screen.getByText('Income health')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No overdue modeled deposits vs recurrence expectations.')).toBeInTheDocument();
    });
  });
});
