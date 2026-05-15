import {
  buildTimingGuidance,
  buildTimingPressureFactors,
  isElevatedTimingPressure,
  timingPressureScore,
} from '@/lib/timing-coordination/pressure';
import type {
  ObligationClusterDto,
  PayoutBillConflictDto,
  ForecastInstabilityWindowDto,
  ReservePrepGoalRefDto,
} from '@/lib/timing-coordination/types';
import { OperationalGoalKind } from '@prisma/client';

function cluster(
  partial: Partial<ObligationClusterDto> = {},
  events: number = 3,
  dense: boolean = false
): ObligationClusterDto {
  return {
    id: partial.id ?? 'c-1',
    startDate: partial.startDate ?? '2026-06-01',
    endDate: partial.endDate ?? '2026-06-05',
    bandDays: partial.bandDays ?? 5,
    totalAmountUsd: partial.totalAmountUsd ?? 600,
    dense,
    events: Array.from({ length: events }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      amountUsd: 200,
      label: `Bill ${i + 1}`,
      kind: 'recurring_bill' as const,
      referenceIds: [`bill-${i + 1}`],
    })),
    reasoning: [],
  };
}

function conflict(date = '2026-06-02', deficit = 200): PayoutBillConflictDto {
  return {
    date,
    deficitUsd: deficit,
    precedingInflowUsd: 100,
    outflowOnDayUsd: 300,
    reasoning: [],
  };
}

function instabilityWindow(): ForecastInstabilityWindowDto {
  return {
    startDate: '2026-06-02',
    endDate: '2026-06-04',
    daysCount: 3,
    thresholdUsd: 250,
    reasoning: [],
  };
}

function reserveGoal(progress = 0.2): ReservePrepGoalRefDto {
  return {
    goalId: 'goal-1',
    name: 'Emergency Fund',
    goalKind: OperationalGoalKind.EMERGENCY_FUND,
    progress,
  };
}

describe('buildTimingPressureFactors', () => {
  it('returns no factors when no signals fire', () => {
    const out = buildTimingPressureFactors({
      clusters: [],
      conflicts: [],
      instabilityWindow: null,
      reservePrepGoals: [],
      contractorLatePayerClientCount: 0,
    });
    expect(out).toEqual([]);
    expect(timingPressureScore(out)).toBe(0);
  });

  it('emits OBLIGATION_CLUSTER_PRESENT and DENSE when a dense cluster exists', () => {
    const out = buildTimingPressureFactors({
      clusters: [cluster({}, 3, true)],
      conflicts: [],
      instabilityWindow: null,
      reservePrepGoals: [],
      contractorLatePayerClientCount: 0,
    });
    const codes = out.map(f => f.code);
    expect(codes).toContain('OBLIGATION_CLUSTER_PRESENT');
    expect(codes).toContain('OBLIGATION_CLUSTER_DENSE');
  });

  it('only emits CONTRACTOR_PAYOUT_OVERLAP when both late payers AND a cluster exist', () => {
    const onlyLate = buildTimingPressureFactors({
      clusters: [],
      conflicts: [],
      instabilityWindow: null,
      reservePrepGoals: [],
      contractorLatePayerClientCount: 2,
    });
    expect(onlyLate.map(f => f.code)).not.toContain('CONTRACTOR_PAYOUT_OVERLAP');

    const both = buildTimingPressureFactors({
      clusters: [cluster()],
      conflicts: [],
      instabilityWindow: null,
      reservePrepGoals: [],
      contractorLatePayerClientCount: 2,
    });
    expect(both.map(f => f.code)).toContain('CONTRACTOR_PAYOUT_OVERLAP');
  });

  it('isElevatedTimingPressure fires on a dense cluster or reserve-prep alone', () => {
    expect(
      isElevatedTimingPressure({ factorsLen: 1, hasDenseCluster: true, hasReservePrepBehind: false })
    ).toBe(true);
    expect(
      isElevatedTimingPressure({ factorsLen: 1, hasDenseCluster: false, hasReservePrepBehind: true })
    ).toBe(true);
    expect(
      isElevatedTimingPressure({ factorsLen: 3, hasDenseCluster: false, hasReservePrepBehind: false })
    ).toBe(true);
    expect(
      isElevatedTimingPressure({ factorsLen: 2, hasDenseCluster: false, hasReservePrepBehind: false })
    ).toBe(false);
  });
});

describe('buildTimingGuidance', () => {
  it('does not emit SHIFT_TO_AVOID_CLUSTER when no recurring_bill event is in a cluster', () => {
    const onlyObligation = cluster({ id: 'c2' }, 3, true);
    onlyObligation.events = onlyObligation.events.map(e => ({ ...e, kind: 'detected_obligation' as const }));
    const out = buildTimingGuidance({
      factors: buildTimingPressureFactors({
        clusters: [onlyObligation],
        conflicts: [],
        instabilityWindow: null,
        reservePrepGoals: [],
        contractorLatePayerClientCount: 0,
      }),
      clusters: [onlyObligation],
      conflicts: [],
      reservePrepGoals: [],
    });
    expect(out.map(r => r.code)).not.toContain('SHIFT_TO_AVOID_CLUSTER');
  });

  it('emits the right guidance for each factor', () => {
    const c = cluster({}, 3, true);
    const factors = buildTimingPressureFactors({
      clusters: [c],
      conflicts: [conflict()],
      instabilityWindow: instabilityWindow(),
      reservePrepGoals: [reserveGoal()],
      contractorLatePayerClientCount: 1,
    });
    const out = buildTimingGuidance({
      factors,
      clusters: [c],
      conflicts: [conflict()],
      reservePrepGoals: [reserveGoal()],
    });
    const codes = out.map(r => r.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'DELAY_DISCRETIONARY_ALLOCATION',
        'PREPARE_RESERVE_BUFFER',
        'SLOW_LOW_PRIORITY_GOAL',
        'SHIFT_TO_AVOID_CLUSTER',
        'CONTRACTOR_TIGHTEN_DEPOSIT_TIMING',
      ])
    );
  });
});
