import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const achievements = [
  {
    id: 'ach_1',
    title: 'First Challenge Joined',
    description: 'Joined your first money challenge',
    awardedAt: '2026-01-18T00:00:00.000Z',
    type: 'challenge',
  },
  {
    id: 'ach_2',
    title: 'Affiliate Explorer',
    description: 'Activated your first affiliate program',
    awardedAt: '2026-02-09T00:00:00.000Z',
    type: 'affiliate',
  },
  {
    id: 'ach_3',
    title: 'Portfolio Starter',
    description: 'Tracked your first portfolio asset',
    awardedAt: '2026-03-22T00:00:00.000Z',
    type: 'investment',
  },
];

export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('[ACHIEVEMENTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
