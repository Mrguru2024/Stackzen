import type { NextRequest } from 'next/server';

/** Client IP for rate limiting / security when `NextRequest.ip` is unavailable (Next.js 16+). */
export function requestClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'anonymous';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim() || 'anonymous';
  }
  return 'anonymous';
}
