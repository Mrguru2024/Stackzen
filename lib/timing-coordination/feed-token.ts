import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-signed userId token used by the public ICS feed. No DB row required.
 *
 * Format: `${base64url(userId.expiresAt)}.${base64url(signature)}`.
 * The signature is HMAC-SHA256 over the first segment.
 */

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 180; // 180 days

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(token: string): Buffer {
  let s = token.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return Buffer.from(s, 'base64');
}

export function signFeedToken(userId: string, secret: string, ttlSec: number = DEFAULT_TTL_SEC): string {
  if (!userId) throw new Error('feed-token: userId required');
  if (!secret) throw new Error('feed-token: secret required');
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, ttlSec);
  const payload = `${userId}.${expiresAt}`;
  const payloadB64 = toBase64Url(Buffer.from(payload, 'utf8'));
  const sig = createHmac('sha256', secret).update(payloadB64).digest();
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export function verifyFeedToken(
  token: string | null | undefined,
  secret: string
): { userId: string; expiresAt: number } | null {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest();
  let providedSig: Buffer;
  try {
    providedSig = fromBase64Url(sigB64);
  } catch {
    return null;
  }
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  let payloadRaw: string;
  try {
    payloadRaw = fromBase64Url(payloadB64).toString('utf8');
  } catch {
    return null;
  }
  const segs = payloadRaw.split('.');
  if (segs.length !== 2) return null;
  const [userId, expStr] = segs;
  const expiresAt = Number.parseInt(expStr, 10);
  if (!userId || !Number.isFinite(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;
  return { userId, expiresAt };
}
