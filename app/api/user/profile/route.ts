import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    // Check if email is being changed
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (currentUser?.email !== validatedData.email) {
      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await prisma.verificationToken.create({
        data: {
          identifier: validatedData.email,
          token: verificationToken,
          expires,
        },
      });

      // Send verification email
      await resend.emails.send({
        from: 'StackZen <noreply@stackzen.com>',
        to: validatedData.email,
        subject: 'Verify your new email address',
        html: `
          <h1>Email Verification</h1>
          <p>Please click the link below to verify your new email address:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        `,
      });

      return new NextResponse(
        JSON.stringify({
          message: 'Verification email sent',
          email: validatedData.email,
        })
      );
    }

    // If email is not being changed, update the profile
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[PROFILE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
