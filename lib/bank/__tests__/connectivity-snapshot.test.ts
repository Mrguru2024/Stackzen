import { BankConnectionStatus } from '@prisma/client';
import { classifyConnectionStaleness } from '@/lib/bank/connectivity-snapshot';

describe('classifyConnectionStaleness', () => {
  const baseCreated = new Date('2020-01-01T00:00:00Z');

  it('returns reconnect_required when not ACTIVE', () => {
    expect(
      classifyConnectionStaleness({
        status: BankConnectionStatus.REQUIRES_REAUTH,
        lastSuccessfulSyncAt: new Date(),
        lastSyncErrorAt: null,
        connectionCreatedAt: baseCreated,
      })
    ).toBe('reconnect_required');
  });

  it('returns post_error when error is newer than success', () => {
    expect(
      classifyConnectionStaleness({
        status: BankConnectionStatus.ACTIVE,
        lastSuccessfulSyncAt: new Date('2024-06-01T00:00:00Z'),
        lastSyncErrorAt: new Date('2024-06-02T00:00:00Z'),
        connectionCreatedAt: baseCreated,
      })
    ).toBe('post_error');
  });

  it('returns healthy for fresh ACTIVE success', () => {
    expect(
      classifyConnectionStaleness({
        status: BankConnectionStatus.ACTIVE,
        lastSuccessfulSyncAt: new Date(),
        lastSyncErrorAt: null,
        connectionCreatedAt: baseCreated,
      })
    ).toBe('healthy');
  });
});
