/**
 * Server-side audit: flag NEXT_PUBLIC_* values that look like secrets.
 * Run in CI via scripts/check-public-env.mjs
 */

const SUSPICIOUS_PATTERNS = [
  /secret/i,
  /password/i,
  /private[_-]?key/i,
  /service[_-]?role/i,
  /sk_live_/i,
  /sk_test_/i,
  /api[_-]?key.*[a-zA-Z0-9]{20,}/i,
];

export function auditPublicEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('NEXT_PUBLIC_')) continue;
    if (!value?.trim()) continue;

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(key) || pattern.test(value)) {
        issues.push(`${key} matches suspicious pattern ${pattern}`);
        break;
      }
    }
  }

  return issues;
}
