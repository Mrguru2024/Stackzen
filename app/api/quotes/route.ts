import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { withAuthZod, withRateLimit } from '@/lib/api/with-security';
import type { AuthedSession } from '@/lib/api/require-auth';
import { quoteCreateSchema } from '@/lib/validation/invoice';
import type { z } from 'zod';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';
import { auditFinancialEvent } from '@/lib/security/financial-audit';
import { logSafeError } from '@/lib/security/safe-log';

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
    logSafeError('QUOTES_GET', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function createQuote(
  _request: Request,
  ctx: { session: AuthedSession; body: z.infer<typeof quoteCreateSchema> }
) {
  try {
    const { title, content, status, jobId } = ctx.body;
    const userId = ctx.session.user.id;

    if (jobId) {
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        select: { id: true },
      });
      if (!job) {
        return NextResponse.json({ error: 'Invalid jobId for this user' }, { status: 400 });
      }
    }

    const quote = await prisma.quote.create({
      data: {
        userId,
        jobId,
        title,
        content,
        status,
      },
    });

    await createFinancialEventSafe({
      userId,
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

    await auditFinancialEvent({
      userId,
      action: 'quote.created',
      resource: quote.id,
      details: { title: quote.title, jobId: quote.jobId },
    });

    return NextResponse.json(quote);
  } catch (error) {
    logSafeError('QUOTE_CREATE', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRateLimit('financial_write')(withAuthZod(quoteCreateSchema, createQuote));
