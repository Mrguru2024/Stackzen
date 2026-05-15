import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const updateServiceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(0, 'Price must be a positive number'),
  duration: z.string().min(1, 'Duration is required'),
  tags: z.array(z.string()),
  isProOnly: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const body = updateServiceSchema.parse(json);

    const durationMatch = body.duration.match(/^(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : null;

    const service = await prisma.service.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: {
        id: params.id,
      },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        price: body.price,
        duration: durationMinutes,
        tags: body.tags,
        isProOnly: body.isProOnly,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    console.error('[SERVICE_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    await prisma.service.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[SERVICE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
