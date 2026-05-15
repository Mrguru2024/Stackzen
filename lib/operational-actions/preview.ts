import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { summarizeForecast } from '@/lib/operational-actions/forecast-summary';
import { loadOperationalProposalForUser } from '@/lib/operational-actions/load-proposal';
import { computeLiveFingerprint } from '@/lib/operational-actions/live-fingerprint';
import type { OperationalActionPreviewDto } from '@/lib/operational-actions/types';

export async function buildOperationalActionPreview(
  userId: string,
  notificationId: string
): Promise<OperationalActionPreviewDto | null> {
  const loaded = await loadOperationalProposalForUser(userId, notificationId);
  if (!loaded || loaded.proposal.status !== 'pending') return null;

  const forecast = await buildCashFlowForecast(userId, { includeDetails: false });
  const liveFp = computeLiveFingerprint(forecast, loaded.proposal);
  const stale = liveFp !== loaded.proposal.fingerprint;

  const base: OperationalActionPreviewDto = {
    notificationId: loaded.notificationId,
    kind: loaded.proposal.kind,
    fingerprint: loaded.proposal.fingerprint,
    forecastSummaryBefore: summarizeForecast(forecast),
    notes: stale
      ? [
          'This proposal was built on an older forecast snapshot. Re-run preview after the Operations hub refreshes proposals, or dismiss this card.',
        ]
      : [
          'Figures below are from the latest deterministic forecast run.',
          'Applying will re-run the same forecast model after the mutation for a before/after comparison.',
        ],
  };

  if (loaded.proposal.kind === 'RECORD_GOAL_CONTRIBUTION') {
    const p = loaded.proposal.payload as {
      suggestedAmount: number;
      currentBucketAmount: number;
    };
    base.goalContributionPreview = {
      suggestedAmount: p.suggestedAmount,
      projectedBucketBalanceAfter: p.currentBucketAmount + p.suggestedAmount,
    };
  }
  if (loaded.proposal.kind === 'EXTEND_GOAL_TARGET_DATE') {
    const p = loaded.proposal.payload as {
      previousTargetDate: string;
      proposedTargetDate: string;
    };
    base.extendGoalPreview = {
      previousTargetDate: p.previousTargetDate,
      proposedTargetDate: p.proposedTargetDate,
    };
  }
  if (loaded.proposal.kind === 'SHIFT_RECURRING_BILL_DATE') {
    const p = loaded.proposal.payload as {
      billId: string;
      billName: string;
      previousDate: string;
      proposedDate: string;
      amount: number;
    };
    base.shiftBillPreview = {
      billId: p.billId,
      billName: p.billName,
      previousDate: p.previousDate,
      proposedDate: p.proposedDate,
      amount: p.amount,
    };
    base.notes.push(
      `Drop moves "${p.billName}" from ${p.previousDate.slice(0, 10)} to ${p.proposedDate.slice(0, 10)}. Only RecurringBill.nextDueDate is written on apply.`,
    );
  }
  if (loaded.proposal.kind === 'PREPARE_RESERVE_FOR_OBLIGATION') {
    const p = loaded.proposal.payload as {
      goalId: string;
      goalName: string;
      clusterId: string;
      targetAmount: number;
    };
    base.prepareReservePreview = {
      goalId: p.goalId,
      goalName: p.goalName,
      clusterId: p.clusterId,
      targetAmount: p.targetAmount,
    };
    base.notes.push(
      `Apply records an intent FinancialEvent only — no money moves. Actual contribution still flows through RECORD_GOAL_CONTRIBUTION.`,
    );
  }

  return base;
}
