import type { JWT } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Features that require active trial or paid subscription
const _PROTECTED_FEATURES = [
  '/dashboard',
  '/expenses',
  '/income',
  '/goals',
  '/challenges',
  '/analytics',
  '/reports',
  '/settings',
  '/api/expenses',
  '/api/income',
  '/api/goals',
  '/api/challenges',
];

// Features that are always accessible (even with expired trial)
const _PUBLIC_FEATURES = [
  '/pricing',
  '/trial/upgrade',
  '/api/trial/status',
  '/api/trial/upgrade',
  '/logout',
  '/api/auth',
];

/**
 * Trial / subscription gate. Prefer legacy `trial-status` + `user-role` cookies when set;
 * otherwise fall back to the NextAuth JWT (middleware already verified the session).
 * Redirecting to /login when cookies were missing caused an infinite loop: Token Present → /login.
 */
export function checkTrialAccess(request: NextRequest, token: JWT | null) {
  const { pathname } = request.nextUrl;

  const trialCookie = request.cookies.get('trial-status')?.value;
  const roleCookie = request.cookies.get('user-role')?.value;

  const sub = token?.subscriptionLevel as string | undefined;
  const roleFromJwt =
    (token?.role as string | undefined) ??
    (sub === 'PRO' || sub === 'ZEN_PLUS' || sub === 'LIFETIME' ? 'PRO' : undefined);

  const trialStatus = trialCookie ?? 'active';
  const userRole = roleCookie ?? roleFromJwt ?? 'USER';

  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE] Path:', pathname, 'trial-status:', trialStatus, 'user-role:', userRole);
  }

  if (_PUBLIC_FEATURES.some(feature => pathname.startsWith(feature))) {
    return null;
  }

  const isProtectedFeature = _PROTECTED_FEATURES.some(feature => pathname.startsWith(feature));

  if (!isProtectedFeature) {
    return null;
  }

  if (userRole === 'PRO' || userRole === 'SUPER_ADMIN') {
    return null;
  }

  if (trialStatus === 'active' || trialStatus === 'pro') {
    return null;
  }

  if (trialStatus === 'expired') {
    return NextResponse.redirect(new URL('/trial/expired', request.url));
  }

  return null;
}

// Helper function to get session (implement based on your auth setup)
// This can remain as a placeholder or be removed if not used
async function getSession(request: NextRequest) {
  // This is a placeholder - implement based on your auth system
  // You might use NextAuth, a custom session system, etc.

  // For now, we'll check for a session token in cookies
  const sessionToken = request.cookies.get('session-token')?.value;

  if (!sessionToken) {
    return null;
  }

  // Validate session token and return user info
  // This is where you'd implement your session validation logic
  try {
    // Example implementation - replace with your actual session validation
    const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
      headers: {
        Cookie: `session-token=${sessionToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Session validation error:', error);
  }

  return null;
}
