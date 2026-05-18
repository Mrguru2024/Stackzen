import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys, CACHE_TTL } from '@/lib/redis';
import { CacheInvalidation } from '@/lib/cache-invalidation';
import { z } from 'zod';

const settingsSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    currency: z.string().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    weeklyReports: z.boolean().optional(),
    goalReminders: z.boolean().optional(),
    challengeUpdates: z.boolean().optional(),
    aiMemoryEnabled: z.boolean().optional(),
    aiOptOut: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Generate cache key for user settings
    const cacheKey = cacheKeys.userSettings(session.user.id);

    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Return default settings if none exist
    const defaultSettings = {
      theme: 'system',
      currency: 'USD',
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      goalReminders: true,
      challengeUpdates: true,
      aiConsentAt: null,
      aiMemoryEnabled: false,
      aiOptOut: false,
    };

    const result = settings || defaultSettings;

    // Cache the result for 30 minutes
    await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SETTINGS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = settingsSchema.parse(body);

    if (validatedData.aiMemoryEnabled === true || validatedData.aiOptOut === false) {
      const existing = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { aiConsentAt: true },
      });
      if (!existing?.aiConsentAt && validatedData.aiOptOut !== true) {
        return NextResponse.json(
          { error: 'Grant AI consent via POST /api/ai/consent before enabling AI memory' },
          { status: 400 }
        );
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    // Invalidate user settings cache
    await CacheInvalidation.invalidateUserCaches(session.user.id);

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[SETTINGS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
