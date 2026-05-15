import { z } from 'zod';

export const operationalCheckpointPatchSchema = z
  .object({
    version: z.literal(1).optional(),
    moneyControl: z
      .object({
        tab: z.enum(['review', 'rules', 'alerts', 'buckets', 'activity']).optional(),
        financialTransactionId: z.string().cuid().nullable().optional(),
      })
      .optional(),
    workspace: z
      .object({
        focusAlertId: z.string().cuid().nullable().optional(),
      })
      .optional(),
    activation: z
      .object({
        dismissedNbaKeys: z.array(z.string().max(120)).max(80).optional(),
        milestoneEventsEmitted: z.array(z.string().max(120)).max(60).optional(),
      })
      .optional(),
  })
  .strict();

export type OperationalCheckpointPatch = z.infer<typeof operationalCheckpointPatchSchema>;

export type OperationalCheckpointPayload = {
  version: number;
  moneyControl?: {
    tab?: 'review' | 'rules' | 'alerts' | 'buckets' | 'activity';
    financialTransactionId?: string | null;
  };
  workspace?: {
    focusAlertId?: string | null;
  };
  activation?: {
    dismissedNbaKeys?: string[];
    milestoneEventsEmitted?: string[];
  };
};

export function mergeOperationalCheckpoint(
  existing: unknown,
  patch: OperationalCheckpointPatch
): OperationalCheckpointPayload {
  const plain =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  const base: OperationalCheckpointPayload = {
    version: typeof plain.version === 'number' ? plain.version : 1,
  };

  if (plain.moneyControl && typeof plain.moneyControl === 'object' && !Array.isArray(plain.moneyControl)) {
    base.moneyControl = {
      ...(plain.moneyControl as OperationalCheckpointPayload['moneyControl']),
    };
  }
  if (plain.workspace && typeof plain.workspace === 'object' && !Array.isArray(plain.workspace)) {
    base.workspace = { ...(plain.workspace as OperationalCheckpointPayload['workspace']) };
  }
  if (plain.activation && typeof plain.activation === 'object' && !Array.isArray(plain.activation)) {
    const a = plain.activation as Record<string, unknown>;
    base.activation = {};
    if (Array.isArray(a.dismissedNbaKeys)) {
      base.activation.dismissedNbaKeys = a.dismissedNbaKeys.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(a.milestoneEventsEmitted)) {
      base.activation.milestoneEventsEmitted = a.milestoneEventsEmitted.filter(
        (x): x is string => typeof x === 'string'
      );
    }
  }

  if (patch.moneyControl) {
    base.moneyControl = { ...base.moneyControl, ...patch.moneyControl };
  }
  if (patch.workspace) {
    base.workspace = { ...base.workspace, ...patch.workspace };
  }
  if (patch.activation) {
    base.activation = { ...base.activation };
    if (patch.activation.dismissedNbaKeys?.length) {
      const prev = base.activation.dismissedNbaKeys ?? [];
      base.activation.dismissedNbaKeys = Array.from(
        new Set([...prev, ...patch.activation.dismissedNbaKeys])
      );
    }
    if (patch.activation.milestoneEventsEmitted?.length) {
      const prev = base.activation.milestoneEventsEmitted ?? [];
      base.activation.milestoneEventsEmitted = Array.from(
        new Set([...prev, ...patch.activation.milestoneEventsEmitted])
      );
    }
  }
  base.version = 1;
  return base;
}
