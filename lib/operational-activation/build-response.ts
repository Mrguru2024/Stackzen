import type { AdaptiveActivationResponseDto } from '@/lib/operational-activation/types';
import { computeDerivedActivationSteps, loadActiveIncomeProfileTypes } from '@/lib/operational-activation/derive-state';
import { buildAdaptiveNextActions } from '@/lib/operational-activation/next-actions';
import { computeProgressiveTier } from '@/lib/operational-activation/progressive-tier';
import type { OperationalCheckpointPayload } from '@/lib/operational-state/checkpoint-payload';

export async function buildAdaptiveActivationResponse(
  userId: string,
  checkpointPayload: unknown
): Promise<AdaptiveActivationResponseDto> {
  const [derivedSteps, incomeProfileTypes] = await Promise.all([
    computeDerivedActivationSteps(userId),
    loadActiveIncomeProfileTypes(userId),
  ]);

  const cp =
    checkpointPayload && typeof checkpointPayload === 'object' && !Array.isArray(checkpointPayload)
      ? (checkpointPayload as OperationalCheckpointPayload)
      : ({ version: 1 } as OperationalCheckpointPayload);

  const dismissed = new Set(cp.activation?.dismissedNbaKeys ?? []);
  const milestoneEventsEmitted = cp.activation?.milestoneEventsEmitted ?? [];

  const progressiveTier = computeProgressiveTier(derivedSteps);
  const nextActions = buildAdaptiveNextActions(derivedSteps, incomeProfileTypes, dismissed, progressiveTier);

  return {
    derivedSteps,
    progressiveTier,
    nextActions,
    checkpointActivation: {
      dismissedNbaKeys: [...dismissed],
      milestoneEventsEmitted,
    },
    incomeProfileTypes,
  };
}
