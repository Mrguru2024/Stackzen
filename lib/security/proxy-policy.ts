/**
 * Central route policy for root `proxy.ts` (Next.js 16 edge).
 * API routes still require per-handler auth (NextAuth JWT) — proxy adds CORS, abuse limits, and page gates.
 */

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

const STATIC_PREFIXES = ['/_next/', '/static/', '/images/'] as const;

const PUBLIC_PAGE_PATHS = new Set([
  '/',
  '/pricing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/account-deleted',
  '/invoices/payment-success',
  '/trial/expired',
  '/verify-request',
]);

const PUBLIC_PAGE_PREFIXES = [
  '/auth/',
  '/stripe/connect/',
  '/stripe/mentor-connect/',
  '/refresh/',
  '/return/',
] as const;

const WEBHOOK_PREFIXES = ['/api/webhooks/', '/api/plaid/webhook'] as const;

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/cron/',
  '/api/webhooks/',
  '/api/plaid/webhook',
] as const;

const FINANCIAL_API_PREFIXES = [
  '/api/income',
  '/api/expenses',
  '/api/expense',
  '/api/invoices',
  '/api/quotes',
  '/api/bank',
  '/api/plaid',
  '/api/transactions',
  '/api/savings-',
] as const;

const STRIPE_API_PREFIX = '/api/stripe';

const AI_API_PREFIXES = ['/api/money-mentor', '/api/ai-recommendations', '/api/ai/'] as const;

const PROTECTED_DASHBOARD_PREFIXES = [
  '/dashboard',
  '/mentor',
  '/mentor-portal',
  '/mentor-dashboard',
  '/become-mentor',
  '/expenses',
  '/income',
  '/invoices',
  '/quotes',
  '/clients',
  '/settings',
  '/goals',
  '/challenges',
  '/analytics',
  '/reports',
  '/services',
  '/jobs',
  '/operational-center',
  '/wellness',
  '/savings',
  '/stackzen',
  '/money-mentor',
  '/financial-mentorship',
  '/mentor-messages',
  '/onboarding',
] as const;

const SUSPICIOUS_PATTERNS = [
  /\.\./,
  /\/\.env/i,
  /\/\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /phpmyadmin/i,
  /\/etc\/passwd/i,
  /<script/i,
  /%00/,
] as const;

export function isStaticAsset(path: string): boolean {
  if (path === '/favicon.ico') return true;
  if (path.includes('.') && !path.startsWith('/api/')) {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    if (
      ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'css', 'js', 'map', 'woff2', 'woff'].includes(
        ext
      )
    ) {
      return true;
    }
  }
  return STATIC_PREFIXES.some(p => path.startsWith(p));
}

/** Public marketing/auth pages (no JWT required). */
export function isPublicPath(path: string): boolean {
  if (PUBLIC_PAGE_PATHS.has(path)) return true;
  return PUBLIC_PAGE_PREFIXES.some(p => path.startsWith(p));
}

/** @deprecated Alias — use `isPublicPath`. */
export const isPublicPage = isPublicPath;

export function isWebhookPath(path: string): boolean {
  return WEBHOOK_PREFIXES.some(p => path.startsWith(p));
}

export function isPublicApiPath(path: string): boolean {
  return PUBLIC_API_PREFIXES.some(p => path.startsWith(p));
}

export function isFinancialApiPath(path: string): boolean {
  if (isWebhookPath(path)) return false;
  return FINANCIAL_API_PREFIXES.some(p => path.startsWith(p));
}

export function isStripeApiPath(path: string): boolean {
  return path.startsWith(STRIPE_API_PREFIX) && !isWebhookPath(path);
}

export function isAiApiPath(path: string): boolean {
  return AI_API_PREFIXES.some(p => path.startsWith(p));
}

export function isAdminApiPath(path: string): boolean {
  return path.startsWith('/api/admin');
}

export function isProtectedDashboardPath(path: string): boolean {
  if (path.startsWith('/admin')) return false;
  return PROTECTED_DASHBOARD_PREFIXES.some(
    p => path === p || path.startsWith(`${p}/`)
  );
}

export function requiresAdminPage(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}

export function requiresAuthenticatedPage(path: string): boolean {
  if (isPublicPath(path) || isStaticAsset(path)) return false;
  if (path.startsWith('/api/')) return false;
  return isProtectedDashboardPath(path) || requiresAdminPage(path);
}

export function isSuspiciousPath(path: string): boolean {
  const decoded = (() => {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  })();
  return SUSPICIOUS_PATTERNS.some(re => re.test(path) || re.test(decoded));
}

export function requiresAdminRole(role: unknown): boolean {
  return typeof role === 'string' && ADMIN_ROLES.has(role);
}

/** @deprecated Alias — use `requiresAdminRole`. */
export const isAdminRole = requiresAdminRole;

export type RateLimitBucket =
  | 'auth_login'
  | 'auth_signup'
  | 'auth_password_reset'
  | 'ai_chat'
  | 'financial_write'
  | 'admin_api'
  | 'webhook_stripe'
  | 'webhook_plaid';

/**
 * Edge rate-limit bucket for API traffic (handler-level limits may still apply).
 */
export function getApiRateLimitBucket(path: string, method: string): RateLimitBucket | null {
  const m = method.toUpperCase();

  if (isAdminApiPath(path)) {
    return 'admin_api';
  }

  if (path.startsWith('/api/auth/') && m === 'POST') {
    if (path.includes('/signup')) return 'auth_signup';
    if (path.includes('/request-reset') || path.includes('/reset-password')) {
      return 'auth_password_reset';
    }
    return 'auth_login';
  }

  if (isAiApiPath(path) && m === 'POST') {
    return 'ai_chat';
  }

  if (
    (isFinancialApiPath(path) || isStripeApiPath(path)) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)
  ) {
    return 'financial_write';
  }

  if (path.startsWith('/api/webhooks/stripe') && m === 'POST') {
    return 'webhook_stripe';
  }

  if (path.startsWith('/api/plaid/webhook') && m === 'POST') {
    return 'webhook_plaid';
  }

  return null;
}

/** Safe same-origin redirect targets for auth callbacks. */
export function isSafeCallbackUrl(candidate: string, origin: string): boolean {
  if (!candidate || candidate.startsWith('//')) return false;
  if (candidate.startsWith('/')) {
    return !candidate.includes('..') && !candidate.includes('\\');
  }
  try {
    const url = new URL(candidate);
    const base = new URL(origin);
    return url.origin === base.origin;
  } catch {
    return false;
  }
}
