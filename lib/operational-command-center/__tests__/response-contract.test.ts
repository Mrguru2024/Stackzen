import type { OperationalAlertsResponseDto } from '@/lib/operational-notifications/types';
import { buildUnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/engine';
import type { OperationalActionListItemDto } from '@/lib/operational-actions/list-pending';
import type { ReserveAndContractorIntelligenceBundle } from '@/lib/reserve-allocation-intelligence/snapshot';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';

const emptyGrouped: OperationalAlertsResponseDto['grouped'] = {
  financial: [],
  automation: [],
  work: [],
  invoice: [],
  billing: [],
  goals: [],
  guidance: [],
};

describe('operational-center alerts response contract', () => {
  it('keeps alerts payload valid without commandCenter (omit includeCommandCenter)', () => {
    const res: OperationalAlertsResponseDto = {
      alerts: [],
      grouped: emptyGrouped,
    };
    expect(res.commandCenter).toBeUndefined();
  });

  it('allows commandCenter when includeCommandCenter=true', () => {
    const bundle = {
      reserve: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        pressureScore: 0,
        factors: [],
        guidance: [],
        weeklyAllocationEstimateUsd: 0,
        enabledAllocationRuleCount: 0,
        enabledAllocationRulesSample: [],
        reserveGoalUnderfillCount: 0,
        topUnderfilledReserveGoals: [],
        discretionaryOutflowStats: {
          lookbackDays: 30,
          sampleSize: 0,
          totalOutflowUsd: 0,
          discretionaryOutflowUsd: 0,
          discretionaryShare: 0,
          topDiscretionaryCategories: [],
        },
        savingsRulesContext: { enabledCount: 0, totalCount: 0, sample: [] },
        explain: { assumptions: [], inputsUsed: {} },
      },
      timing: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        pressureScore: 0,
        factors: [],
        clusters: [],
        conflicts: [],
        instabilityWindow: null,
        reservePrepGoals: [],
        guidance: [],
        calendarEntries: [],
        explain: { assumptions: [], inputsUsed: {} },
      },
      contractor: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        hasContractorContext: false,
        jobsSample: [],
        materialExposure: [],
        negativeMarginJobs: [],
        openReceivables: [],
        receivableConcentration: {
          openInvoiceCount: 0,
          totalOpenUsd: 0,
          herfindahlIndex: 0,
          topClients: [],
          reasoning: [],
        },
        latePayerClients: [],
        collectionTiming: {
          windowDays: 14,
          upcomingWithinWindowCount: 0,
          meanDaysUntilDue: null,
          stdevDaysUntilDue: null,
          reasoning: [],
        },
        reserveNudges: [],
        forecastRiskCodes: [],
        explain: { assumptions: [], inputsUsed: {} },
      },
    } as ReserveAndContractorIntelligenceBundle;

    const workflow: WorkflowResolutionSnapshotDto = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      windowDays: 14,
      momentumFactorCount: 0,
      factors: [],
      appliedActions: [],
      dismissedActionCount: 0,
      recommendationsIssuedInWindow: 0,
      attentionAutoResolvedInWindow: 0,
      goalContributions: { count: 0, totalUsd: 0, goalsTouched: 0, milestoneCount: 0 },
      activationMilestonesInWindow: 0,
      openAttention: { queueSize: 0, oldestPendingProposalAgeDays: null, oldestPendingProposalNotificationId: null },
      explain: { assumptions: [], inputsUsed: {} },
    };

    const commandCenter = buildUnifiedOperationalCommandCenterDto({
      bundle,
      workflow,
      pendingProposals: [] as OperationalActionListItemDto[],
    });

    const res: OperationalAlertsResponseDto = {
      alerts: [],
      grouped: emptyGrouped,
      commandCenter,
    };

    expect(res.commandCenter?.subsystems).toHaveLength(4);
    expect(res.commandCenter?.continuation.primaryCta.href).toBe('/cash-flow');
    expect(res.commandCenter?.continuation.executionHandoff?.source).toBe('command_center');
    expect(res.commandCenter?.continuation.executionHandoff?.ctaLadderStep).toBe(6);
  });
});
