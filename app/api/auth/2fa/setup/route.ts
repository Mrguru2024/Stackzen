import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TwoFactorAuth } from '@/lib/auth/two-factor';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const twoFactorAuth = TwoFactorAuth.getInstance();
    const { secret, qrCode } = await twoFactorAuth.setup(session.user.id);

    return NextResponse.json({ secret, qrCode });
  } catch (error) {
    console.error('2FA setup error:', error);
    return new NextResponse('Failed to setup 2FA', { status: 500 });
  }
}
