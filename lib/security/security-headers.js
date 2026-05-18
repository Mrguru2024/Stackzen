/**
 * CommonJS helpers for `next.config.js` (cannot import TypeScript directly).
 */

function buildProdCsp() {
  const parts = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://production.plaid.com https://sandbox.plaid.com https://development.plaid.com https://challenges.cloudflare.com https://*.sentry.io https://*.ingest.sentry.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://cdn.plaid.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  const reportUri = process.env.CSP_REPORT_URI?.trim();
  if (reportUri) {
    parts.push(`report-uri ${reportUri}`);
  }

  return parts.join('; ');
}

const DEV_CSP =
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:; frame-ancestors 'none';";

const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()';

function cspEnabled() {
  return process.env.CSP_ENABLED !== 'false';
}

function hstsEnabled() {
  return process.env.HSTS_ENABLED !== 'false' && process.env.NODE_ENV === 'production';
}

/**
 * @param {boolean} [isProduction]
 * @returns {Array<{ key: string; value: string }>}
 */
function getGlobalSecurityHeaders(isProduction) {
  const prod = isProduction ?? process.env.NODE_ENV === 'production';
  const headers = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Document-Policy', value: 'js-profiling' },
  ];

  if (cspEnabled()) {
    headers.push({
      key: 'Content-Security-Policy',
      value: prod ? buildProdCsp() : DEV_CSP,
    });
  }

  if (hstsEnabled()) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}

module.exports = {
  getGlobalSecurityHeaders,
  buildProdCsp,
  DEV_CSP,
};
