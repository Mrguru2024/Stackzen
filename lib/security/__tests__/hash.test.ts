import { hashIp, hashUserAgent, deriveDeviceLabel } from '@/lib/security/hash';

describe('security/hash', () => {
  beforeAll(() => {
    process.env.SESSION_HASH_PEPPER = 'test-pepper';
  });

  it('hashes IP deterministically', () => {
    const a = hashIp('203.0.113.1');
    const b = hashIp('203.0.113.1');
    expect(a).toBe(b);
    expect(a).not.toBe('203.0.113.1');
  });

  it('hashes user agent separately from IP', () => {
    expect(hashUserAgent('Mozilla/5.0')).not.toBe(hashIp('Mozilla/5.0'));
  });

  it('derives a device label from user agent', () => {
    expect(deriveDeviceLabel('Mozilla/5.0 (iPhone)')).toBe('Mobile browser');
    expect(deriveDeviceLabel('Mozilla/5.0 (Windows NT)')).toBe('Windows');
  });
});
