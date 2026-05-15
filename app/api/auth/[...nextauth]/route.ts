import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/** Avoid HTML error pages on /api/auth/* when Prisma/DB is unavailable (client expects JSON). */
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
