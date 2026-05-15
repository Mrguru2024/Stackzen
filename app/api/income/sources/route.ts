import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { isPlaidConfigured } from '@/lib/env';
import { parseIncomeSourcesJson } from '@/lib/income/payout-channels';

const putSchema = z
  .object({
    payoutChannelIds: z.array(z.string().max(64)).max(32),
    customLabels: z.array(z.string().max(80)).max(10).optional().default([]),
  })
  .strict();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const [connections, onboarding] = await Promise.all([
    prisma.bankConnection.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'REQUIRES_REAUTH', 'ERROR'] },
      },
      select: {
        id: true,
        institutionName: true,
        status: true,
        lastSuccessfulSyncAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.userOnboardingData.findUnique({
      where: { userId },
      select: { incomeSources: true },
    }),
  ]);

  const parsed = parseIncomeSourcesJson(onboarding?.incomeSources);

  return NextResponse.json({
    plaidConfigured: isPlaidConfigured(),
    bankConnections: connections,
    payoutChannelIds: parsed.payoutChannelIds,
    customLabels: parsed.customLabels,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const userId = session.user.id;
  const existing = await prisma.userOnboardingData.findUnique({
    where: { userId },
    select: { incomeSources: true },
  });

  const prevObject =
    existing?.incomeSources && typeof existing.incomeSources === 'object' && !Array.isArray(existing.incomeSources)
      ? (existing.incomeSources as Record<string, unknown>)
      : {};

  const nextIncomeSources = {
    ...prevObject,
    payoutChannelIds: parsed.data.payoutChannelIds,
    customLabels: parsed.data.customLabels,
  };

  await prisma.userOnboardingData.upsert({
    where: { userId },
    create: {
      userId,
      incomeSources: nextIncomeSources,
    },
    update: {
      incomeSources: nextIncomeSources,
    },
  });

  return NextResponse.json({
    payoutChannelIds: parsed.data.payoutChannelIds,
    customLabels: parsed.data.customLabels,
  });
}
