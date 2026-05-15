import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';

// Feedback schema validation
const feedbackSchema = z.object({
  timeSpent: z.string(),
  featuresUsed: z.array(z.string()),
  performance: z.object({
    pageLoadTimes: z.string(),
    responseTimes: z.string(),
    lagFreezing: z.boolean(),
  }),
  deviceInfo: z.object({
    deviceType: z.string(),
    browser: z.string(),
    os: z.string(),
  }),
  suggestions: z.string(),
  rating: z.number().min(1).max(5),
});

export async function POST(request: Request) {
  const limited = await enforceApiRateLimit(request, 'feedback_submit');
  if (limited) return limited;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    const details = {
      timeSpent: validatedData.timeSpent,
      featuresUsed: validatedData.featuresUsed,
      performance: validatedData.performance,
      deviceInfo: validatedData.deviceInfo,
      suggestions: validatedData.suggestions,
    };

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        rating: validatedData.rating,
        content:
          validatedData.suggestions.length > 0
            ? validatedData.suggestions.slice(0, 8000)
            : 'Feedback submission',
        details,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feedback.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
