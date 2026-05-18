import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/api/rate-limit-request';

export function isTurnstileConfigured(): boolean {
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return Boolean(site && secret);
}

export function isTurnstileRequired(): boolean {
  return isTurnstileConfigured() && process.env.NODE_ENV === 'production';
}

type TurnstileVerifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Bot protection is not configured' };
    }
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: 'Bot verification required' };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token.trim());
  if (remoteIp && remoteIp !== 'unknown' && remoteIp !== 'anonymous') {
    body.set('remoteip', remoteIp);
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (data.success) {
      return { ok: true };
    }
    return { ok: false, error: 'Bot verification failed' };
  } catch {
    return { ok: false, error: 'Bot verification unavailable' };
  }
}

export function extractTurnstileToken(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const token = (body as { turnstileToken?: unknown }).turnstileToken;
  return typeof token === 'string' ? token : undefined;
}

/**
 * Returns a JSON error response when Turnstile is required and invalid; otherwise null.
 */
export async function enforceTurnstile(
  request: Request,
  body: unknown
): Promise<NextResponse | null> {
  if (!isTurnstileRequired()) {
    if (isTurnstileConfigured()) {
      const token = extractTurnstileToken(body);
      if (token) {
        const result = await verifyTurnstileToken(token, getClientIp(request));
        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
      }
    }
    return null;
  }

  const token = extractTurnstileToken(body);
  if (!token) {
    return NextResponse.json({ error: 'Bot verification required' }, { status: 400 });
  }

  const result = await verifyTurnstileToken(token, getClientIp(request));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return null;
}

export async function verifyTurnstileForRequest(
  request: Request,
  token?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTurnstileRequired()) {
    if (isTurnstileConfigured() && token?.trim()) {
      return verifyTurnstileToken(token, getClientIp(request));
    }
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: 'Bot verification required' };
  }

  return verifyTurnstileToken(token, getClientIp(request));
}
