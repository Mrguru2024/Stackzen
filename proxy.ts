import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkTrialAccess } from './middleware/trial-check';
import { forwardAuthCookies, updateSession } from '@/lib/supabase/middleware';
import { handleCorsPreflight, withCors } from '@/lib/cors';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { IPBlocker } from '@/lib/auth/ip-blocker';
import { requestClientIp } from '@/lib/request-ip';
import {
  getApiRateLimitBucket,
  isPublicPath,
  isSafeCallbackUrl,
  isStaticAsset,
  isSuspiciousPath,
  requiresAdminPage,
  requiresAdminRole,
  requiresAuthenticatedPage,
} from '@/lib/security/proxy-policy';

const ipBlocker = IPBlocker.getInstance();

function jsonError(
  sessionResponse: NextResponse,
  request: NextRequest,
  body: Record<string, string>,
  status: number
): NextResponse {
  const res = NextResponse.json(body, { status });
  return withCors(request, forwardAuthCookies(sessionResponse, res));
}

export async function proxy(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const sessionResponse = await updateSession(request);

    if (isSuspiciousPath(path)) {
      return jsonError(sessionResponse, request, { error: 'Forbidden' }, 403);
    }

    const ip = requestClientIp(request);
    if (await ipBlocker.isBlocked(ip)) {
      const { maybeSampledRateLimitBreadcrumb } = await import('@/lib/security/sentry');
      maybeSampledRateLimitBreadcrumb('proxy.ip_blocked', ip);
      return jsonError(sessionResponse, request, { error: 'Too many requests' }, 429);
    }

    const origin = request.nextUrl.origin;
    for (const param of ['callbackUrl', 'next'] as const) {
      const value = request.nextUrl.searchParams.get(param);
      if (value && !isSafeCallbackUrl(value, origin)) {
        return jsonError(sessionResponse, request, { error: 'Invalid redirect' }, 400);
      }
    }

    if (path.startsWith('/api/')) {
      const preflight = handleCorsPreflight(request);
      if (preflight) {
        return forwardAuthCookies(sessionResponse, preflight);
      }

      const bucket = getApiRateLimitBucket(path, request.method);
      if (bucket) {
        const limited = await enforceApiRateLimit(request, bucket);
        if (limited) {
          const { maybeSampledRateLimitBreadcrumb } = await import('@/lib/security/sentry');
          maybeSampledRateLimitBreadcrumb(`proxy.${bucket}`, ip);
          return withCors(request, forwardAuthCookies(sessionResponse, limited));
        }
      }

      return withCors(request, sessionResponse);
    }

    if (isStaticAsset(path)) {
      return sessionResponse;
    }

    if (isPublicPath(path)) {
      return sessionResponse;
    }

    if (!requiresAuthenticatedPage(path)) {
      return sessionResponse;
    }

    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not configured');
      return forwardAuthCookies(
        sessionResponse,
        NextResponse.redirect(new URL('/login', request.url))
      );
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const login = new URL('/login', request.url);
      if (path !== '/login') {
        login.searchParams.set('callbackUrl', path);
      }
      return forwardAuthCookies(sessionResponse, NextResponse.redirect(login));
    }

    if (requiresAdminPage(path) && !requiresAdminRole(token.role)) {
      return forwardAuthCookies(
        sessionResponse,
        NextResponse.redirect(new URL('/dashboard', request.url))
      );
    }

    const response = NextResponse.next();
    forwardAuthCookies(sessionResponse, response);
    response.headers.set('x-middleware-cache', 'no-cache');

    const trialResponse = checkTrialAccess(request, token);
    if (trialResponse) {
      return forwardAuthCookies(sessionResponse, trialResponse);
    }

    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
