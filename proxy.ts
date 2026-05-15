import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkTrialAccess } from './middleware/trial-check';
import { RateLimiter } from './lib/auth/rate-limit';
import { IPBlocker } from './lib/auth/ip-blocker';
import { forwardAuthCookies, updateSession } from '@/lib/supabase/middleware';

const rateLimiter = RateLimiter.getInstance({
  maxAttempts: process.env.NODE_ENV === 'production' ? 5 : 10000,
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1000,
  blockDuration: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 60 * 1000,
});

const ipBlocker = IPBlocker.getInstance();

export async function proxy(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    const sessionResponse = await updateSession(request);

    if (
      path.startsWith('/_next/') ||
      path.startsWith('/api/auth/') ||
      path.startsWith('/api/') ||
      path.includes('.') ||
      path === '/favicon.ico' ||
      path.startsWith('/static/') ||
      path.startsWith('/images/')
    ) {
      return sessionResponse;
    }

    const isPublicPath =
      path === '/login' ||
      path === '/register' ||
      path === '/forgot-password' ||
      path === '/auth/signin' ||
      path === '/auth/signout' ||
      path === '/auth/callback' ||
      path === '/auth/verify-request';

    if (isPublicPath) {
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

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Proxy] Path: ${path}, Public: ${isPublicPath}, Token: ${token ? 'Present' : 'Missing'}`
      );
    }

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Proxy] Redirecting unauthenticated user from ${path} to /login`);
      }
      return forwardAuthCookies(
        sessionResponse,
        NextResponse.redirect(new URL('/login', request.url))
      );
    }

    const response = NextResponse.next();
    forwardAuthCookies(sessionResponse, response);
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('x-middleware-skip', 'false');

    const trialResponse = checkTrialAccess(request, token);
    if (trialResponse) {
      return forwardAuthCookies(sessionResponse, trialResponse);
    }

    return response;
  } catch (error) {
    console.error('Proxy error:', error);

    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
