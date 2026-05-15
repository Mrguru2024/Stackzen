import { FinancialEventSource, FinancialEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { computeDerivedActivationSteps } from '@/lib/operational-activation/derive-state';
import type { DerivedActivationSteps, OperationalActivationStepKey } from '@/lib/operational-activation/types';
import { mergeOperationalCheckpoint } from '@/lib/operational-state/checkpoint-payload';

type BooleanStepField = {
  [K in keyof DerivedActivationSteps]: DerivedActivationSteps[K] extends boolean ? K : never;
}[keyof DerivedActivationSteps];

const STEP_ORDER: { step: OperationalActivationStepKey; field: BooleanStepField }[] = [
  { step: 'income_profile_selected', field: 'income_profile_selected' },
  { step: 'bank_linked', field: 'bank_linked' },
  { step: 'ledger_populated', field: 'ledger_populated' },
  { step: 'transactions_categorized', field: 'transactions_categorized' },
  { step: 'envelopes_or_automation', field: 'envelopes_or_automation' },
  { step: 'forecast_engaged', field: 'forecast_engaged' },
  { step: 'operational_goal_created', field: 'operational_goal_created' },
  { step: 'attention_queue_engaged', field: 'attention_queue_engaged' },
];

export async function recordOperationalActivationMilestones(userId: string): Promise<{ newlyRecorded: string[] }> {
  const derived = await computeDerivedActivationSteps(userId);
  const row = await prisma.userOperationalCheckpoint.findUnique({ where: { userId } });
  const existingPayload = row?.payload ?? { version: 1 };
  const emitted = new Set(
    (existingPayload as { activation?: { milestoneEventsEmitted?: string[] } })?.activation
      ?.milestoneEventsEmitted ?? []
  );

  const newlyRecorded: string[] = [];

  for (const { step, field } of STEP_ORDER) {
    if (!derived[field]) continue;
    if (emitted.has(step)) continue;
    newlyRecorded.push(step);
    emitted.add(step);
    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE,
      source: FinancialEventSource.API_AUTOMATION,
      metadata: {
        step,
        evidence: derived.evidence,
      },
    });
  }

  if (newlyRecorded.length === 0) {
    return { newlyRecorded };
  }

  const merged = mergeOperationalCheckpoint(existingPayload, {
    activation: { milestoneEventsEmitted: newlyRecorded },
  });

  await prisma.userOperationalCheckpoint.upsert({
    where: { userId },
    create: { userId, payload: merged },
    update: { payload: merged },
  });

  return { newlyRecorded };
}
