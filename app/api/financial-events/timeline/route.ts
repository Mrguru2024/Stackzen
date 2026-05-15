import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FinancialEntityType, FinancialEventSource, FinancialEventType } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { getFinancialTimeline } from '@/lib/financial-events/query';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().cuid().optional(),
  jobId: z.string().cuid().optional(),
  relatedEntityType: z.nativeEnum(FinancialEntityType).optional(),
  types: z
    .string()
    .optional()
    .transform(value =>
      value
        ? value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        : []
    )
    .refine(values => values.every(value => value in FinancialEventType), {
      message: 'Invalid event type value',
    })
    .transform(values => values as FinancialEventType[]),
  sources: z
    .string()
    .optional()
    .transform(value =>
      value
        ? value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
        : []
    )
    .refine(values => values.every(value => value in FinancialEventSource), {
      message: 'Invalid source value',
    })
    .transform(values => values as FinancialEventSource[]),
});

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get('limit') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    jobId: url.searchParams.get('jobId') ?? undefined,
    relatedEntityType: url.searchParams.get('relatedEntityType') ?? undefined,
    types: url.searchParams.get('types') ?? undefined,
    sources: url.searchParams.get('sources') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const data = await getFinancialTimeline(session.user.id, parsed.data);
  return NextResponse.json(data);
}

