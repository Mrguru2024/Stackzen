import { redactString, redactValue } from '@/lib/security/redact';

describe('redact', () => {
  it('redacts card numbers in strings', () => {
    expect(redactString('card 4111111111111111')).toContain('[CARD_REDACTED]');
  });

  it('redacts bearer tokens', () => {
    expect(redactString('Authorization: Bearer abc.def.ghi')).toContain('[REDACTED]');
  });

  it('redacts sensitive object keys', () => {
    const out = redactValue({
      access_token: 'secret-token',
      institutionName: 'Chase',
      accounts: [{ id: '1' }],
    }) as Record<string, unknown>;
    expect(out.access_token).toBe('[REDACTED]');
    expect(out.institutionName).toBe('Chase');
    expect(out.accounts).toBe('[PLAID_PAYLOAD_REDACTED]');
  });
});
