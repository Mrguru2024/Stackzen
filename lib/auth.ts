import { getServerSession } from 'next-auth';
import { getSession, signIn, signOut } from 'next-auth/react';
import { authOptions } from '@/lib/auth-config';

/** Server-side session (Route Handlers, Server Components). */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export { getSession, signIn, signOut, authOptions };
