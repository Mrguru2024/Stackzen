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
    const isValid = await twoFactorAuth.verifySetup(session.user.id, code);

    if (!isValid) {
      return new NextResponse('Invalid code', { status: 400 });
    }

    // Generate backup codes
    const backupCodes = await twoFactorAuth.generateBackupCodes(session.user.id);

    return NextResponse.json({ backupCodes });
  } catch (error) {
    console.error('2FA verification error:', error);
    return new NextResponse('Failed to verify 2FA', { status: 500 });
  }
}
