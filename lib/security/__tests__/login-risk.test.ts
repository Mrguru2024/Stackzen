import { evaluateLoginRisk } from '@/lib/security/login-risk';
import { IPBlocker } from '@/lib/auth/ip-blocker';
import { writeAuditLog } from '@/lib/security/audit-log';
import { isKnownDevice } from '@/lib/security/user-session';

jest.mock('@/lib/auth/ip-blocker');
jest.mock('@/lib/security/audit-log');
jest.mock('@/lib/security/user-session');

const mockIpBlocker = {
  isBlocked: jest.fn(),
  recordFailedAttempt: jest.fn(),
  recordSuccessfulAttempt: jest.fn(),
};

describe('evaluateLoginRisk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (IPBlocker.getInstance as jest.Mock).mockReturnValue(mockIpBlocker);
    mockIpBlocker.isBlocked.mockResolvedValue(false);
    (isKnownDevice as jest.Mock).mockResolvedValue(true);
  });

  it('blocks when IP is on block list', async () => {
    mockIpBlocker.isBlocked.mockResolvedValue(true);

    const result = await evaluateLoginRisk({
      userId: 'u1',
      ip: '1.2.3.4',
      success: true,
    });

    expect(result.blocked).toBe(true);
    expect(result.reasons).toContain('ip_blocked');
  });

  it('records failed login without blocking', async () => {
    const result = await evaluateLoginRisk({
      userId: 'u1',
      email: 'a@b.com',
      ip: '1.2.3.4',
      success: false,
    });

    expect(result.blocked).toBe(false);
    expect(mockIpBlocker.recordFailedAttempt).toHaveBeenCalledWith('1.2.3.4');
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it('flags new device for successful login', async () => {
    (isKnownDevice as jest.Mock).mockResolvedValue(false);

    const result = await evaluateLoginRisk({
      userId: 'u1',
      ip: '1.2.3.4',
      success: true,
      role: 'USER',
    });

    expect(result.challengeMfa).toBe(true);
    expect(result.reasons).toContain('new_device');
  });
});
