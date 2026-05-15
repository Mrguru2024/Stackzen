import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';

const querySchema = z.object({
  window: z.enum(['7', '14', '30']).optional(),
  includeDetails: z.coerce.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    window: url.searchParams.get('window') ?? undefined,
    includeDetails: url.searchParams.get('includeDetails') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = await buildCashFlowForecast(session.user.id, {
    includeDetails: parsed.data.includeDetails,
  });

  if (parsed.data.window) {
    const wd = Number(parsed.data.window) as 7 | 14 | 30;
    return NextResponse.json({
      ...data,
      windows: data.windows.filter(w => w.windowDays === wd),
      focusedWindowDays: wd,
    });
  }

  return NextResponse.json(data);
}
