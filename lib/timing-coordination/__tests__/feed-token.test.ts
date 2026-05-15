import { signFeedToken, verifyFeedToken } from '@/lib/timing-coordination/feed-token';

const SECRET = 'this-is-a-test-secret-with-enough-length';

describe('feed-token', () => {
  it('round-trips a valid userId', () => {
    const token = signFeedToken('user-1', SECRET, 60);
    const out = verifyFeedToken(token, SECRET);
    expect(out?.userId).toBe('user-1');
    expect(out?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects an empty or malformed token', () => {
    expect(verifyFeedToken('', SECRET)).toBeNull();
    expect(verifyFeedToken('not.a.valid.format', SECRET)).toBeNull();
    expect(verifyFeedToken('xyz', SECRET)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = signFeedToken('user-1', SECRET, 60);
    const [, sig] = token.split('.');
    const evilPayload = Buffer.from('user-2.9999999999', 'utf8').toString('base64url');
    const tampered = `${evilPayload}.${sig}`;
    expect(verifyFeedToken(tampered, SECRET)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signFeedToken('user-1', SECRET, 60);
    // Manually craft an expired one
    const expiredPayload = Buffer.from('user-1.1', 'utf8').toString('base64url');
    const expiredToken = `${expiredPayload}.${token.split('.')[1]}`;
    expect(verifyFeedToken(expiredToken, SECRET)).toBeNull();
  });

  it('rejects when secret is missing', () => {
    const token = signFeedToken('user-1', SECRET, 60);
    expect(verifyFeedToken(token, '')).toBeNull();
  });
});
