import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTrialUpgradeSession } from '@/lib/trial-management';
import { z } from 'zod';

const upgradeSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { country, state } = upgradeSchema.parse(body);

    const checkoutSession = await createTrialUpgradeSession(session.user.id, country, state);

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Trial upgrade error:', error);
    return NextResponse.json({ error: 'Failed to create upgrade session' }, { status: 500 });
  }
}
