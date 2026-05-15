import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'SentryExampleAPIError';
  }
}

/** Dev-only: triggers a Sentry test error. Disabled in production. */
export function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  throw new SentryExampleAPIError(
    'This error is raised on the backend called by the example page.'
  );
}
