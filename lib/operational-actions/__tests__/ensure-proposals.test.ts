/**
 * Tests the auto-sweep guard inside `ensureOperationalActionProposals`: any
 * operational_action_* notification whose proposal kind is *not* auto-built
 * (e.g. SHIFT_RECURRING_BILL_DATE created by drag-and-drop) MUST survive a
 * hub refresh even when the auto-built desired set is empty.
 */

import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';

interface FakeNotificationRow {
  id: string;
  userId: string;
  readAt: Date | null;
  type: string;
  title: string;
  body: string;
  severity: string;
  metadata: Record<string, unknown>;
}

// In-memory store so we can assert the sweep's behaviour without touching Postgres.
const store: FakeNotificationRow[] = [];

const findManyImpl = jest.fn(async () => store.filter(r => r.readAt === null));
const findFirstImpl = jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
  for (const row of store) {
    if (row.id !== where.id) continue;
    if (where.userId && row.userId !== where.userId) continue;
    return row;
  }
  return null;
});
const updateImpl = jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
  const row = store.find(r => r.id === where.id);
  if (!row) return null;
  Object.assign(row, data);
  return row;
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    automationNotification: {
      findMany: (...args: unknown[]) => findManyImpl(...args as []),
      findFirst: (...args: unknown[]) => findFirstImpl(...(args as [{ where: Record<string, unknown> }])),
      update: (...args: unknown[]) => updateImpl(...(args as [{ where: Record<string, unknown>; data: Record<string, unknown> }])),
    },
  },
}));

jest.mock('@/lib/operational-actions/build-proposals', () => ({
  buildOperationalActionProposalRows: jest.fn(async () => []),
}));

jest.mock('@/lib/financial-automation/rules-engine', () => ({
  createAutomationNotification: jest.fn(),
}));

jest.mock('@/lib/financial-automation/actionable-metadata', () => ({
  buildOperationalAttentionMetadata: jest.fn(() => ({ attentionKind: 'noop' })),
}));

jest.mock('@/lib/operational-integrity/metadata', () => ({
  mergeNotificationMetadata: (existing: Record<string, unknown> | undefined, patch: Record<string, unknown>) => ({
    ...(existing ?? {}),
    ...patch,
  }),
}));

import { ensureOperationalActionProposals } from '@/lib/operational-actions/ensure-proposals';

function seed(id: string, kind: OperationalActionProposalCore['kind'], attentionKind: string): FakeNotificationRow {
  const proposal: OperationalActionProposalCore = {
    version: 1,
    status: 'pending',
    kind,
    fingerprint: 'fp_' + id,
    lastForecastGeneratedAt: '2026-05-12T04:00:00.000Z',
    payload: { _test: true } as unknown as OperationalActionProposalCore['payload'],
    explain: { why: '', dataInfluences: [], calculations: [], expectedImpact: '' },
  };
  const row: FakeNotificationRow = {
    id,
    userId: 'u1',
    readAt: null,
    type: 'AUTOMATION_ACTION',
    title: 'Test ' + id,
    body: 'Body',
    severity: 'INFO',
    metadata: { attentionKind, operationalActionProposal: proposal },
  };
  store.push(row);
  return row;
}

describe('ensureOperationalActionProposals sweep guard', () => {
  beforeEach(() => {
    store.length = 0;
    jest.clearAllMocks();
  });

  it('does NOT mark a SHIFT_RECURRING_BILL_DATE proposal as read when the desired set is empty', async () => {
    const row = seed('shift1', 'SHIFT_RECURRING_BILL_DATE', 'operational_action_shift_bill_xyz');
    await ensureOperationalActionProposals('u1');
    expect(row.readAt).toBeNull();
    expect(updateImpl).not.toHaveBeenCalled();
  });

  it('does NOT mark a PREPARE_RESERVE_FOR_OBLIGATION proposal as read', async () => {
    const row = seed('prep1', 'PREPARE_RESERVE_FOR_OBLIGATION', 'operational_action_prep_reserve_abc');
    await ensureOperationalActionProposals('u1');
    expect(row.readAt).toBeNull();
  });

  it('DOES mark an auto-built (PAUSE_AUTOMATION_RULE) proposal read when not in the desired set', async () => {
    const row = seed('pause1', 'PAUSE_AUTOMATION_RULE', 'operational_action_pause_rule_x');
    await ensureOperationalActionProposals('u1');
    expect(row.readAt).not.toBeNull();
  });

  it('ignores notifications whose attentionKind is NOT operational_action_*', async () => {
    const row = seed('other', 'PAUSE_AUTOMATION_RULE', 'cashflow_balance_runway_30d');
    await ensureOperationalActionProposals('u1');
    expect(row.readAt).toBeNull();
  });
});
