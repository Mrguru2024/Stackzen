import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendDeletionConfirmation } from '@/lib/email';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const GRACE_PERIOD_DAYS = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { password } = deleteAccountSchema.parse(body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.password) {
      return new NextResponse('Password not set for this account', { status: 400 });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return new NextResponse('Invalid password', { status: 400 });
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + GRACE_PERIOD_DAYS);

    const originalEmail = user.email;
    if (!originalEmail) {
      return new NextResponse('User email missing', { status: 400 });
    }

    const tombstoneEmail = `deleted_${originalEmail.replace(/@/g, '_at_')}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: tombstoneEmail,
        name: user.name ? `Deleted (${user.name})` : 'Deleted user',
      },
    });

    if (originalEmail) {
      await sendDeletionConfirmation(originalEmail, user.name || 'User', deletionDate);
    }

    return NextResponse.json({
      message: 'Account scheduled for deletion',
      deletionDate,
    });
  } catch (error) {
    console.error('[DELETE_ACCOUNT]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
