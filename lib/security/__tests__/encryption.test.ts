import {
  decryptJson,
  decryptSensitiveString,
  encryptJson,
  encryptSensitiveString,
  isEncryptedPayload,
} from '@/lib/security/encryption';

describe('encryption', () => {
  const prev = process.env;

  beforeEach(() => {
    process.env = { ...prev, NODE_ENV: 'test', BANK_TOKEN_ENCRYPTION_KEY: 'a'.repeat(32) };
  });

  afterAll(() => {
    process.env = prev;
  });

  it('round-trips string encryption', () => {
    const plain = 'plaid-access-token-xyz';
    const enc = encryptSensitiveString(plain);
    expect(isEncryptedPayload(enc)).toBe(true);
    expect(decryptSensitiveString(enc)).toBe(plain);
  });

  it('round-trips JSON encryption', () => {
    const payload = { payoutChannelIds: ['stripe'], customLabels: ['gigs'] };
    const enc = encryptJson(payload);
    expect(decryptJson<typeof payload>(enc)).toEqual(payload);
  });

  it('throws in production without BANK_TOKEN_ENCRYPTION_KEY', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BANK_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptSensitiveString('x')).toThrow(/BANK_TOKEN_ENCRYPTION_KEY/);
  });

  it('rejects invalid encrypted payload format', () => {
    expect(() => decryptSensitiveString('not-a-valid-payload')).toThrow(
      /Invalid encrypted payload format/
    );
    expect(isEncryptedPayload('bad')).toBe(false);
  });

  it('rejects tampered ciphertext', () => {
    const enc = encryptSensitiveString('secret');
    const parts = enc.split(':');
    parts[2] = Buffer.from('tampered').toString('base64');
    expect(() => decryptSensitiveString(parts.join(':'))).toThrow();
  });
});
