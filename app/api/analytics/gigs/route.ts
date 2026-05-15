import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getGigAnalytics, getGigRecommendations } from '@/lib/analytics/gigAnalytics';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';

    if (type === 'recommendations') {
      const recommendations = await getGigRecommendations(session.user.id);
      return NextResponse.json(recommendations);
    }

    // Get analytics for the user's gigs
    const analytics = await getGigAnalytics(session.user.id);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in /api/analytics/gigs:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
