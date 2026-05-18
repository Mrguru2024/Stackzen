import {
  getApiRateLimitBucket,
  isAdminApiPath,
  isAiApiPath,
  isFinancialApiPath,
  isProtectedDashboardPath,
  isPublicPath,
  isSafeCallbackUrl,
  isSuspiciousPath,
  isWebhookPath,
  requiresAdminRole,
} from '../proxy-policy';

describe('proxy-policy', () => {
  it('flags suspicious paths', () => {
    expect(isSuspiciousPath('/api/../admin')).toBe(true);
    expect(isSuspiciousPath('/api/users')).toBe(false);
  });

  it('identifies public paths', () => {
    expect(isPublicPath('/pricing')).toBe(true);
    expect(isPublicPath('/dashboard')).toBe(false);
  });

  it('classifies protected dashboard paths', () => {
    expect(isProtectedDashboardPath('/expenses')).toBe(true);
    expect(isProtectedDashboardPath('/admin/dashboard')).toBe(false);
  });

  it('classifies API path groups', () => {
    expect(isAdminApiPath('/api/admin/users')).toBe(true);
    expect(isFinancialApiPath('/api/invoices')).toBe(true);
    expect(isAiApiPath('/api/money-mentor')).toBe(true);
    expect(isWebhookPath('/api/webhooks/stripe')).toBe(true);
  });

  it('accepts admin roles', () => {
    expect(requiresAdminRole('ADMIN')).toBe(true);
    expect(requiresAdminRole('USER')).toBe(false);
  });

  it('assigns API rate limit buckets', () => {
    expect(getApiRateLimitBucket('/api/admin/users', 'GET')).toBe('admin_api');
    expect(getApiRateLimitBucket('/api/income', 'POST')).toBe('financial_write');
    expect(getApiRateLimitBucket('/api/money-mentor', 'POST')).toBe('ai_chat');
    expect(getApiRateLimitBucket('/api/auth/signup', 'POST')).toBe('auth_signup');
    expect(getApiRateLimitBucket('/api/auth/request-reset', 'POST')).toBe(
      'auth_password_reset'
    );
    expect(getApiRateLimitBucket('/api/webhooks/stripe', 'POST')).toBe('webhook_stripe');
    expect(getApiRateLimitBucket('/api/plaid/webhook', 'POST')).toBe('webhook_plaid');
  });

  it('validates safe callback URLs', () => {
    expect(isSafeCallbackUrl('/dashboard', 'https://stackzen.com')).toBe(true);
    expect(isSafeCallbackUrl('https://evil.com', 'https://stackzen.com')).toBe(false);
    expect(isSafeCallbackUrl('//evil.com', 'https://stackzen.com')).toBe(false);
  });
});
