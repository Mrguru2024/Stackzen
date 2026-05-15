import {
  fingerprintForExtendGoal,
  fingerprintForGoalContribution,
  fingerprintForPauseRule,
  fingerprintForPrepareReserve,
  fingerprintForShiftBill,
} from '@/lib/operational-actions/fingerprint';
import { computeLiveFingerprint } from '@/lib/operational-actions/live-fingerprint';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';

function fakeForecast(generatedAt: string, riskCodes: string[] = []): CashFlowForecastResponseDto {
  return {
    generatedAt,
    windows: [],
    risks: riskCodes.map(code => ({
      code,
      severity: 'INFO',
      reason: 'test',
      windowDays: 30,
    })) as CashFlowForecastResponseDto['risks'],
    inputs: { startingBalance: 1000 },
  } as CashFlowForecastResponseDto;
}

describe('operational action fingerprints', () => {
  it('changes when forecast generation timestamp changes', () => {
    const a = fingerprintForPauseRule({
      forecastGeneratedAt: '2026-01-01T00:00:00.000Z',
      riskCodes: ['ALLOCATION_PRESSURE'],
      ruleId: 'rule1',
    });
    const b = fingerprintForPauseRule({
      forecastGeneratedAt: '2026-01-02T00:00:00.000Z',
      riskCodes: ['ALLOCATION_PRESSURE'],
      ruleId: 'rule1',
    });
    expect(a).not.toBe(b);
  });

  it('is stable for same inputs', () => {
    const a = fingerprintForGoalContribution({
      forecastGeneratedAt: '2026-01-01T00:00:00.000Z',
      goalId: 'g1',
      suggestedAmount: '100.00',
    });
    const b = fingerprintForGoalContribution({
      forecastGeneratedAt: '2026-01-01T00:00:00.000Z',
      goalId: 'g1',
      suggestedAmount: '100.00',
    });
    expect(a).toBe(b);
  });

  it('extend-goal fingerprint is keyed only on goalId and proposedTargetDate', () => {
    const a = fingerprintForExtendGoal({
      forecastGeneratedAt: '2026-01-01T00:00:00.000Z',
      goalId: 'g1',
      proposedTargetDate: '2026-06-30',
    });
    const b = fingerprintForExtendGoal({
      forecastGeneratedAt: '2026-01-01T00:00:00.000Z',
      goalId: 'g1',
      proposedTargetDate: '2026-07-01',
    });
    expect(a).not.toBe(b);
  });
});

describe('SHIFT_RECURRING_BILL_DATE fingerprint round-trip', () => {
  it('static fn and live fn agree when proposal payload matches what API route creates', () => {
    const generatedAt = '2026-05-12T04:00:00.000Z';
    const proposedDateIso = '2026-06-15T00:00:00.000Z';
    const billId = 'bill_abc';

    const directFp = fingerprintForShiftBill({
      forecastGeneratedAt: generatedAt,
      billId,
      proposedDate: proposedDateIso,
    });

    const proposal: OperationalActionProposalCore = {
      version: 1,
      status: 'pending',
      kind: 'SHIFT_RECURRING_BILL_DATE',
      fingerprint: directFp,
      lastForecastGeneratedAt: generatedAt,
      payload: {
        billId,
        billName: 'Power',
        previousDate: '2026-06-01T00:00:00.000Z',
        proposedDate: proposedDateIso,
        amount: 120,
      } as unknown as OperationalActionProposalCore['payload'],
      explain: { why: '', dataInfluences: [], calculations: [], expectedImpact: '' },
    };

    const liveFp = computeLiveFingerprint(fakeForecast(generatedAt), proposal);
    expect(liveFp).toBe(directFp);
  });

  it('day-equivalent proposedDate values (e.g. T00:00 vs T23:59) produce the same fingerprint', () => {
    const generatedAt = '2026-05-12T04:00:00.000Z';
    const billId = 'bill_xyz';
    const a = fingerprintForShiftBill({
      forecastGeneratedAt: generatedAt,
      billId,
      proposedDate: '2026-06-15T00:00:00.000Z',
    });
    const b = fingerprintForShiftBill({
      forecastGeneratedAt: generatedAt,
      billId,
      proposedDate: '2026-06-15T23:59:59.999Z',
    });
    expect(a).toBe(b);
  });

  it('different proposed days produce different fingerprints', () => {
    const generatedAt = '2026-05-12T04:00:00.000Z';
    const a = fingerprintForShiftBill({
      forecastGeneratedAt: generatedAt,
      billId: 'b',
      proposedDate: '2026-06-14T00:00:00.000Z',
    });
    const b = fingerprintForShiftBill({
      forecastGeneratedAt: generatedAt,
      billId: 'b',
      proposedDate: '2026-06-15T00:00:00.000Z',
    });
    expect(a).not.toBe(b);
  });
});

describe('PREPARE_RESERVE_FOR_OBLIGATION fingerprint round-trip', () => {
  it('static fn and live fn agree on the same payload', () => {
    const generatedAt = '2026-05-12T04:00:00.000Z';
    const directFp = fingerprintForPrepareReserve({
      forecastGeneratedAt: generatedAt,
      goalId: 'goal_reserve_1',
      clusterId: 'cluster_abc',
      targetAmount: '500.00',
    });

    const proposal: OperationalActionProposalCore = {
      version: 1,
      status: 'pending',
      kind: 'PREPARE_RESERVE_FOR_OBLIGATION',
      fingerprint: directFp,
      lastForecastGeneratedAt: generatedAt,
      payload: {
        goalId: 'goal_reserve_1',
        clusterId: 'cluster_abc',
        targetAmount: 500,
      } as unknown as OperationalActionProposalCore['payload'],
      explain: { why: '', dataInfluences: [], calculations: [], expectedImpact: '' },
    };

    const liveFp = computeLiveFingerprint(fakeForecast(generatedAt), proposal);
    expect(liveFp).toBe(directFp);
  });

  it('changes when targetAmount changes', () => {
    const generatedAt = '2026-05-12T04:00:00.000Z';
    const a = fingerprintForPrepareReserve({
      forecastGeneratedAt: generatedAt,
      goalId: 'g',
      clusterId: 'c',
      targetAmount: '100.00',
    });
    const b = fingerprintForPrepareReserve({
      forecastGeneratedAt: generatedAt,
      goalId: 'g',
      clusterId: 'c',
      targetAmount: '200.00',
    });
    expect(a).not.toBe(b);
  });
});
