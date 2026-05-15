import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { TwoFactorAuth } from '@/lib/auth/two-factor';
import { prisma } from '@/lib/prisma';

const twoFactorAuth = TwoFactorAuth.getInstance();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, token } = await req.json();

    switch (action) {
      case 'setup': {
        const { secret, qrCode } = await twoFactorAuth.setup(session.user.id);
        return NextResponse.json({ secret, qrCode });
      }

      case 'verify-setup': {
        if (!token) {
          return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const isValid = await twoFactorAuth.verifySetup(session.user.id, token);
        if (isValid) {
          // Update database
          await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorEnabled: true },
          });
        }

        return NextResponse.json({ success: isValid });
      }

      case 'disable': {
        if (!token) {
          return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const isValid = await twoFactorAuth.disable(session.user.id, token);
        if (isValid) {
          // Update database
          await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorEnabled: false },
          });
        }

        return NextResponse.json({ success: isValid });
      }

      case 'generate-backup-codes': {
        const codes = await twoFactorAuth.generateBackupCodes(session.user.id);
        return NextResponse.json({ codes });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
