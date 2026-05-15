import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cache, CACHE_TTL } from '@/lib/redis';
import { CacheInvalidation } from '@/lib/cache-invalidation';
import { z } from 'zod';

const serviceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  price: z.number().min(1),
  duration: z.string(),
  tags: z.array(z.string()),
  isProOnly: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = serviceSchema.parse(body);
    const durationMatch = validatedData.duration.match(/^(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : null;
    const { duration: _durationStr, ...rest } = validatedData;

    const service = await prisma.service.create({
      data: {
        ...rest,
        duration: durationMinutes,
        userId: session.user.id,
      },
    });

    // Invalidate related caches
    await CacheInvalidation.invalidateServiceCaches(session.user.id);

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    console.error('Error creating service:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    // Generate cache key based on query parameters
    const cacheKey = `services:${category || 'all'}:${userId || 'all'}`;

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const where = {
      ...(category && category !== 'all' ? { category } : {}),
      ...(userId ? { userId } : {}),
    };

    const services = await prisma.service.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Cache the result for 10 minutes
    await cache.set(cacheKey, services, CACHE_TTL.SHORT);

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
