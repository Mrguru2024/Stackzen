import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export type ProjectStatus = 'completed' | 'in-progress' | 'upcoming' | 'pending';

export interface ProjectForecastItem {
  id: string;
  name: string;
  forecastedAmount: number;
  actualAmount: number;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  clientName: string | null;
}

export interface ProjectsResponse {
  items: ProjectForecastItem[];
  hasData: boolean;
}

function mapJobStatus(status: JobStatus, startDate: Date | null): ProjectStatus {
  if (status === JobStatus.COMPLETED || status === JobStatus.PAID || status === JobStatus.CLOSED) {
    return 'completed';
  }
  if (
    status === JobStatus.IN_PROGRESS ||
    status === JobStatus.AWAITING_PAYMENT
  ) {
    return 'in-progress';
  }
  if (
    (status === JobStatus.NEW ||
      status === JobStatus.QUOTED ||
      status === JobStatus.APPROVED ||
      status === JobStatus.DEPOSIT_PENDING) &&
    startDate &&
    startDate > new Date()
  ) {
    return 'upcoming';
  }
  return 'pending';
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const userId = session.user.id;
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: { client: { select: { name: true } } },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const items: ProjectForecastItem[] = jobs.map(job => ({
      id: job.id,
      name: job.title,
      forecastedAmount: job.estimatedAmount ?? 0,
      actualAmount: job.jobRevenue ?? 0,
      startDate: job.startDate ? job.startDate.toISOString() : null,
      endDate: job.endDate ? job.endDate.toISOString() : null,
      status: mapJobStatus(job.status, job.startDate),
      clientName: job.client?.name ?? null,
    }));

    return NextResponse.json<ProjectsResponse>({
      items,
      hasData: items.length > 0,
    });
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createProjectSchema = z
  .object({
    clientId: z.string().cuid(),
    name: z.string().min(1).max(200),
    forecastedAmount: z.number().nonnegative().finite(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    description: z.string().max(2000).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { clientId, name, forecastedAmount, startDate, endDate, description } = parsed.data;

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.user.id },
      select: { id: true, name: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        clientId,
        title: name,
        description: description ?? null,
        estimatedAmount: forecastedAmount,
        remainingBalance: forecastedAmount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: JobStatus.NEW,
      },
    });

    const item: ProjectForecastItem = {
      id: job.id,
      name: job.title,
      forecastedAmount: job.estimatedAmount ?? 0,
      actualAmount: job.jobRevenue ?? 0,
      startDate: job.startDate ? job.startDate.toISOString() : null,
      endDate: job.endDate ? job.endDate.toISOString() : null,
      status: mapJobStatus(job.status, job.startDate),
      clientName: client.name,
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
