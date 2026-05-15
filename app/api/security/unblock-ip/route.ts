import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { IPBlocker } from '@/lib/auth/ip-blocker';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ip } = await request.json();
    if (!ip) {
      return new NextResponse('IP address is required', { status: 400 });
    }

    const ipBlocker = IPBlocker.getInstance();
    await ipBlocker.unblockIP(ip);

    return new NextResponse('IP unblocked successfully');
  } catch (error) {
    console.error('IP unblock error:', error);
    return new NextResponse('Failed to unblock IP', { status: 500 });
  }
}
