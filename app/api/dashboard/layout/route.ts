import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  dashboardLayoutBodySchema,
  reconcileLayout,
} from '@/lib/dashboard/reconcile-layout';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { dashboardLayout: true },
  });

  const items = reconcileLayout(settings?.dashboardLayout ?? null);
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const raw = await request.json().catch(() => null);
  const parsed = dashboardLayoutBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid layout payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const items = reconcileLayout(parsed.data.items);

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, dashboardLayout: items },
    update: { dashboardLayout: items },
  });

  return NextResponse.json({ items });
}
