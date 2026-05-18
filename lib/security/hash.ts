import { createHash } from 'crypto';

function getPepper(): string {
  return (
    process.env.SESSION_HASH_PEPPER?.trim() ||
    process.env.BANK_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'stackzen-dev-session-pepper'
  );
}

export function hashForStorage(value: string, scope: string): string {
  return createHash('sha256').update(`${scope}:${getPepper()}:${value}`).digest('hex');
}

export function hashIp(ip: string): string {
  return hashForStorage(ip, 'ip');
}

export function hashUserAgent(userAgent: string): string {
  return hashForStorage(userAgent || 'unknown', 'ua');
}

export function deriveDeviceLabel(userAgent: string): string {
  const ua = userAgent || 'Unknown device';
  if (/Mobile|iPhone|iPad|Android/i.test(ua)) return 'Mobile browser';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Web browser';
}
