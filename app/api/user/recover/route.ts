import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendRecoveryConfirmation } from '@/lib/email';

const recoverAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = recoverAccountSchema.parse(body);

    const tombstoneEmail = `deleted_${email.replace(/@/g, '_at_')}`;

    const user = await prisma.user.findFirst({
      where: { email: tombstoneEmail },
    });

    if (!user || !user.password) {
      return new NextResponse('Account not found or grace period expired', {
        status: 404,
      });
    }

    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return new NextResponse('Invalid password', { status: 400 });
    }

    const restoredName = user.name?.match(/^Deleted \((.*)\)$/)?.[1] ?? user.name ?? 'User';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        name: restoredName,
      },
    });

    await sendRecoveryConfirmation(email, restoredName);

    return NextResponse.json({
      message: 'Account recovered successfully',
    });
  } catch (error) {
    console.error('[RECOVER_ACCOUNT]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
