import { z } from 'zod';

/**
 * Server-only environment validation. Import only from API routes, server components,
 * or `instrumentation.ts` — never from client components.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(1)
    .refine(s => s.length >= 16, 'NEXTAUTH_SECRET should be at least 16 characters'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).optional(),
  PLAID_WEBHOOK_VERIFICATION_KEY: z.string().optional(),
  PLAID_WEBHOOK_SIGNING_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  BANK_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  CSP_ENABLED: z.string().optional(),
  CSP_REPORT_URI: z.string().optional(),
  HSTS_ENABLED: z.string().optional(),
  SECURITY_STRICT_RATE_LIMIT: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  ENABLE_AI_FEATURES: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  AI_REQUEST_TIMEOUT_MS: z.string().optional(),
  AI_MAX_FALLBACK_DEPTH: z.string().optional(),
  ENCRYPT_CHAT_CONTENT: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: { ok: true; env: ServerEnv } | { ok: false; error: z.ZodError } | null = null;

export function validateServerEnv():
  | { ok: true; env: ServerEnv }
  | { ok: false; error: z.ZodError } {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    cached = { ok: false, error: parsed.error };
    return cached;
  }
  cached = { ok: true, env: parsed.data };
  return cached;
}

/** Call at startup (e.g. instrumentation) to fail fast in production when core vars are missing. */
export function assertCoreServerEnv(): void {
  const r = validateServerEnv();
  if (!r.ok) {
    const msg = r.error.flatten().fieldErrors;
    console.error('[env] Invalid server environment:', msg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid server environment: see logs for field errors');
    }
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    const bankKey = process.env.BANK_TOKEN_ENCRYPTION_KEY?.trim();
    if (!bankKey || bankKey.length < 32) {
      throw new Error(
        'BANK_TOKEN_ENCRYPTION_KEY is required in production (32+ characters) for Plaid tokens and sensitive fields'
      );
    }
  }

  if (process.env.NODE_ENV === 'production') {
    if (!r.env.STRIPE_SECRET_KEY?.trim()) {
      console.warn('[env] STRIPE_SECRET_KEY is empty — payment routes will fail.');
    }
    if (!r.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      console.warn('[env] STRIPE_WEBHOOK_SECRET is empty — Stripe webhooks cannot be verified.');
    }
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
      console.warn(
        '[env] NEXT_PUBLIC_SENTRY_DSN is empty — production errors will not be reported to Sentry.'
      );
    }
  }
}

export function isSentryConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function isPlaidConfigured(): boolean {
  const id = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  return Boolean(id && secret);
}

export function isUpstashRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? '';
  return url.startsWith('https://') && token.length > 0;
}

export function isTurnstileConfigured(): boolean {
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return Boolean(site && secret);
}

export function isStrictRateLimitEnabled(): boolean {
  return process.env.SECURITY_STRICT_RATE_LIMIT === 'true';
}
