import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { requireAuthSession, type AuthedSession } from '@/lib/api/require-auth';
import { requireAdminSession, type AdminUser } from '@/lib/api/require-admin';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { zodErrorResponse } from '@/lib/validation/errors';

type RouteContext = Record<string, unknown>;

type AuthedHandler = (
  request: Request,
  ctx: RouteContext & { session: AuthedSession }
) => Promise<NextResponse> | NextResponse;

type AdminHandler = (
  request: Request,
  ctx: RouteContext & { session: AuthedSession; admin: AdminUser }
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: AuthedHandler) {
  return async (request: Request, ctx?: RouteContext) => {
    const { session, response } = await requireAuthSession();
    if (response || !session) {
      return response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, { ...(ctx ?? {}), session });
  };
}

export function withAdmin(handler: AdminHandler) {
  return async (request: Request, ctx?: RouteContext) => {
    const { session, user, response } = await requireAdminSession();
    if (response || !session || !user) {
      return response ?? NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(request, { ...(ctx ?? {}), session, admin: user });
  };
}

export function withRateLimit(bucket: string, options?: { strict?: boolean }) {
  return (handler: (request: Request, ctx?: RouteContext) => Promise<NextResponse> | NextResponse) =>
    async (request: Request, ctx?: RouteContext) => {
      const limited = await enforceApiRateLimit(request, bucket, options);
      if (limited) return limited;
      return handler(request, ctx);
    };
}

export function withZod<T extends z.ZodTypeAny>(schema: T) {
  return (
    handler: (
      request: Request,
      ctx: RouteContext & { body: z.infer<T> }
    ) => Promise<NextResponse> | NextResponse
  ) =>
    async (request: Request, ctx?: RouteContext) => {
      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return zodErrorResponse(parsed.error);
      }

      return handler(request, { ...(ctx ?? {}), body: parsed.data });
    };
}

/** Auth + JSON body validation (auth runs before parse). */
export function withAuthZod<T extends z.ZodTypeAny>(
  schema: T,
  handler: (
    request: Request,
    ctx: { session: AuthedSession; body: z.infer<T> }
  ) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (request, authCtx) => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    return handler(request, { session: authCtx.session, body: parsed.data });
  });
}

/** Compose wrappers right-to-left: composeHandlers(handler, withZod(...), withAuth, withRateLimit(...)) */
export function composeHandlers(
  handler: (request: Request, ctx?: RouteContext) => Promise<NextResponse> | NextResponse,
  ...wrappers: Array<
    (h: (request: Request, ctx?: RouteContext) => Promise<NextResponse> | NextResponse) => (
      request: Request,
      ctx?: RouteContext
    ) => Promise<NextResponse> | NextResponse
  >
): (request: Request, ctx?: RouteContext) => Promise<NextResponse> | NextResponse {
  return wrappers.reduceRight((acc, wrap) => wrap(acc), handler);
}
