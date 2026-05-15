import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { notFoundInProduction } from '@/lib/api/production-gate';

export async function GET() {
  const blocked = notFoundInProduction();
  if (blocked) return blocked;

  const session = await getServerSession(authOptions);
  return Response.json(session);
}
