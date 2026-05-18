import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessMetRepairsCommandCenter } from '@/lib/integrations/met-repairs/access';
import {
  generateMetRepairsIntegrationApiKey,
  MET_REPAIRS_API_KEY_PREFIX,
} from '@/lib/integrations/met-repairs/generate-api-key';
import { MET_REPAIRS_PRODUCTION_URL } from '@/lib/integrations/met-repairs/paths';

export const dynamic = 'force-dynamic';

/** One-time integration key generation (admin only). Key is not stored — copy to both deployments. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canAccessMetRepairsCommandCenter(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = generateMetRepairsIntegrationApiKey();

  return NextResponse.json({
    apiKey,
    keyPrefix: MET_REPAIRS_API_KEY_PREFIX,
    metRepairsApiUrl: MET_REPAIRS_PRODUCTION_URL,
    stackZenEnvVar: 'MET_REPAIRS_API_KEY',
    metRepairsEnvVar: 'STACKZEN_API_KEY',
    instructions: [
      `Set MET_REPAIRS_API_URL=${MET_REPAIRS_PRODUCTION_URL} on StackZen (Vercel + local).`,
      'Set MET_REPAIRS_API_KEY on StackZen to the generated key.',
      'Set STACKZEN_API_KEY on MET Repairs OS (metrepairs.com) to the same key.',
      'Redeploy both apps after updating environment variables.',
    ],
  });
}
