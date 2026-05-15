import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';

/**
 * Quotes API — Prisma `Quote` model is minimal (`userId`, `title`, `content`, `status`).
 * Extended payloads (locations, tiers, etc.) are not represented in the current schema.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotes = await prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quoteSchema = z
      .object({
        title: z.string().min(1),
        content: z.string().min(1),
        status: z.string().default('draft'),
        jobId: z.string().cuid().optional(),
      })
      .strict();

    const parsed = quoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          detail: 'Current schema supports { title, content, status?, jobId? } only.',
        },
        { status: 400 }
      );
    }
    const { title, content, status, jobId } = parsed.data;

    if (jobId) {
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId: session.user.id },
        select: { id: true },
      });
      if (!job) {
        return NextResponse.json({ error: 'Invalid jobId for this user' }, { status: 400 });
      }
    }

    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        jobId,
        title,
        content,
        status,
      },
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.QUOTE_CREATED,
      source: FinancialEventSource.API_QUOTES,
      relatedEntityType: FinancialEntityType.QUOTE,
      relatedEntityId: quote.id,
      metadata: {
        quoteId: quote.id,
        title: quote.title,
        status: quote.status,
        jobId: quote.jobId,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
