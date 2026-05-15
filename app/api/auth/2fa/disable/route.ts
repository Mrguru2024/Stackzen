import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { TwoFactorAuth } from '@/lib/auth/two-factor';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return new NextResponse('Code is required', { status: 400 });
    }

    const twoFactorAuth = TwoFactorAuth.getInstance();
    const isValid = await twoFactorAuth.disable(session.user.id, code);

    if (!isValid) {
      return new NextResponse('Invalid code', { status: 400 });
    }

    return new NextResponse('2FA disabled successfully');
  } catch (error) {
    console.error('2FA disable error:', error);
    return new NextResponse('Failed to disable 2FA', { status: 500 });
  }
}
