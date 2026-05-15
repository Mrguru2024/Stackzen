import { NextResponse } from 'next/server';

/** Block diagnostic/test API routes in production (no information disclosure). */
export function notFoundInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
