import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/** Returns a generic client message; never exposes full Zod tree in production. */
export function zodErrorResponse(error: ZodError): NextResponse {
  const message = error.errors[0]?.message ?? 'Invalid request';
  return NextResponse.json({ error: message }, { status: 400 });
}
