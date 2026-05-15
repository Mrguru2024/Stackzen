import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export type AuthedSession = Session & { user: { id: string; email?: string | null } };

/**
 * Shared guard for App Router API routes using NextAuth (JWT).
 * Returns JSON 401 when unauthenticated — prefer over ad-hoc string bodies.
 */
export async function requireAuthSession(): Promise<
  { session: AuthedSession; response: null } | { session: null; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!session || !userId) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session: session as AuthedSession, response: null };
}
