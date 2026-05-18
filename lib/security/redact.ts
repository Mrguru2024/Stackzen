const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

const SENSITIVE_KEYS = new Set([
  'access_token',
  'accessToken',
  'accessTokenEncrypted',
  'refresh_token',
  'refreshToken',
  'password',
  'secret',
  'authorization',
  'stripeSignature',
  'client_secret',
  'private_key',
  'account_number',
  'routing_number',
  'ssn',
  'twoFactorSecret',
]);

const REDACTED = '[REDACTED]';

export function redactString(input: string): string {
  return input
    .replace(CARD_PATTERN, '[CARD_REDACTED]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(JWT_PATTERN, '[JWT_REDACTED]');
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED;
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key) || /token|secret|password/i.test(key)) {
        out[key] = REDACTED;
      } else if (key === 'accounts' || key === 'transactions' || key === 'item') {
        out[key] = '[PLAID_PAYLOAD_REDACTED]';
      } else {
        out[key] = redactValue(val, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function redactForLog(...args: unknown[]): unknown[] {
  return args.map(arg => redactValue(arg));
}
