import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';

/** Prisma `Report` model is optional in some deployments; access via loose typing when present. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reportDelegate = (prisma as any).report as
  | {
      findMany: (args: { where: { userId: string } }) => Promise<unknown[]>;
      create: (args: { data: { name: string; date: Date; userId: string } }) => Promise<unknown>;
    }
  | undefined;

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  if (!reportDelegate) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const reports = await reportDelegate.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(reports);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  if (!reportDelegate) {
    return NextResponse.json({ error: 'Reports are not configured on this deployment' }, { status: 501 });
  }

  try {
    const body = await request.json();
    const { name, date } = body as { name?: string; date?: string };

    if (!name || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await reportDelegate.create({
      data: {
        name,
        date: new Date(date),
        userId: session.user.id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
