import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { SecurityService } from '@/lib/auth/security';
import { getToken } from 'next-auth/jwt';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const IP_BLOCK_DURATION = 3600;
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_DURATION = 24 * 60 * 60;
const MAX_CONCURRENT_SESSIONS = 3;

const protectedRoutes = ['/api/dashboard', '/api/calendar', '/api/quotes', '/api/profile'];

export async function securityMiddleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;

  if (await isIPBlocked(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many failed attempts. Please try again later.' }),
      { status: 429 }
    );
  }

  const rateLimitKey = SecurityService.getRateLimitKey(ip, 'API');
  const isAllowed = await SecurityService.checkRateLimit(rateLimitKey, 'API');

  if (!isAllowed) {
    await incrementFailedAttempts(ip);
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429 }
    );
  }

  if (isAuthenticatedRoute(path)) {
    const token = await getToken({ req: request });
    if (token) {
      const sessionCheck = await checkSession(token.sub as string, request);
      if (!sessionCheck.allowed) {
        return new NextResponse(JSON.stringify({ error: sessionCheck.message }), { status: 401 });
      }
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

async function isIPBlocked(ip: string): Promise<boolean> {
  const blocked = await redis.get(`blocked:${ip}`);
  return !!blocked;
}

async function incrementFailedAttempts(ip: string): Promise<void> {
  const attempts = await redis.incr(`attempts:${ip}`);
  if (attempts === 1) {
    await redis.expire(`attempts:${ip}`, IP_BLOCK_DURATION);
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await redis.set(`blocked:${ip}`, '1', 'EX', IP_BLOCK_DURATION);
  }
}

function isAuthenticatedRoute(path: string): boolean {
  return protectedRoutes.some((route: string) => path.startsWith(route));
}

async function checkSession(
  userId: string,
  request: NextRequest
): Promise<{ allowed: boolean; message?: string }> {
  const sessionId = request.cookies.get('session_id')?.value;
  if (!sessionId) {
    return { allowed: false, message: 'No active session' };
  }

  const session = await redis.get(`session:${userId}:${sessionId}`);
  if (!session) {
    return { allowed: false, message: 'Invalid session' };
  }

  const sessions = await redis.smembers(`user_sessions:${userId}`);
  if (sessions.length > MAX_CONCURRENT_SESSIONS) {
    const oldestSession = sessions[0];
    if (oldestSession) {
      await redis.del(`session:${userId}:${oldestSession}`);
      await redis.srem(`user_sessions:${userId}`, oldestSession);
    }
  }

  await redis.expire(`session:${userId}:${sessionId}`, SESSION_DURATION);

  return { allowed: true };
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

export const _config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/calendar/:path*', '/quotes/:path*', '/profile/:path*'],
};
