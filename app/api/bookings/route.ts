import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const bookingSchema = z.object({
  serviceId: z.string(),
  date: z.string(),
  time: z.string(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const booking = await prisma.booking.create({
      data: {
        serviceId: validatedData.serviceId,
        userId: session.user.id,
        date: new Date(validatedData.date),
        time: validatedData.time,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('[BOOKINGS_POST]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}
