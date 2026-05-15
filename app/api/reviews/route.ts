import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const reviewSchema = z.object({
  serviceId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Create the review
    const review = await prisma.review.create({
      data: {
        serviceId: validatedData.serviceId,
        userId: session.user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
    });

    // Update service rating and review count
    const serviceReviews = await prisma.review.findMany({
      where: {
        serviceId: validatedData.serviceId,
      },
    });

    const averageRating =
      serviceReviews.reduce((acc, review) => acc + review.rating, 0) / serviceReviews.length;

    await prisma.service.update({
      where: {
        id: validatedData.serviceId,
      },
      data: {
        rating: averageRating,
        reviews: serviceReviews.length,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('[REVIEWS_POST]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}
