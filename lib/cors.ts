import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const defaults = [
    'https://stackzen.com',
    'https://www.stackzen.com',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, ''),
  ].filter((o): o is string => Boolean(o));

  const merged = [...defaults, ...(fromEnv ?? [])];
  if (process.env.NODE_ENV === 'development') {
    merged.push('http://localhost:3000');
  }

  return [...new Set(merged)];
}

let cachedOrigins: string[] | null = null;

export function getAllowedOrigins(): string[] {
  if (!cachedOrigins) {
    cachedOrigins = parseAllowedOrigins();
  }
  return cachedOrigins;
}

/** Clears cached origins (tests only). */
export function resetAllowedOriginsCache(): void {
  cachedOrigins = null;
}

function resolveAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')?.trim() ?? '';
  if (!origin) return null;
  return getAllowedOrigins().includes(origin) ? origin : null;
}

const corsHeaderValues = {
  methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  headers:
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  maxAge: '86400',
} as const;

function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const allowed = resolveAllowedOrigin(request);
  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', allowed);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  response.headers.set('Access-Control-Allow-Methods', corsHeaderValues.methods);
  response.headers.set('Access-Control-Allow-Headers', corsHeaderValues.headers);
  response.headers.set('Vary', 'Origin');
  return response;
}

/** Handle API CORS preflight at the edge. No wildcard origin with credentials. */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null;
  const allowed = resolveAllowedOrigin(request);
  if (!allowed) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': corsHeaderValues.methods,
      'Access-Control-Allow-Headers': corsHeaderValues.headers,
      'Access-Control-Max-Age': corsHeaderValues.maxAge,
    },
  });
}

/** Merge CORS headers onto an existing proxy response. */
export function withCors(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }
  return applyCorsHeaders(request, response);
}

/** @deprecated Use `withCors` from `proxy.ts`. */
export const _cors = async (request: NextRequest) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  return applyCorsHeaders(request, NextResponse.next());
};
