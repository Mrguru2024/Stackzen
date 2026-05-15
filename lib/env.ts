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
    if (!r.env.STRIPE_SECRET_KEY?.trim()) {
      console.warn('[env] STRIPE_SECRET_KEY is empty — payment routes will fail.');
    }
    if (!r.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      console.warn('[env] STRIPE_WEBHOOK_SECRET is empty — Stripe webhooks cannot be verified.');
    }
  }
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
