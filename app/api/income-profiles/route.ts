import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  IncomeProfileType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  incomeProfileLabels,
  resolveIncomeProfileActivation,
} from '@/lib/income-profiles/activation';
import { createFinancialEventSafe } from '@/lib/financial-events/events';

const updateSchema = z
  .object({
    profiles: z.array(z.nativeEnum(IncomeProfileType)).min(1),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const profiles = await prisma.userIncomeProfile.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { type: true },
  });

  const profileTypes = profiles.map(profile => profile.type);
  const activation = resolveIncomeProfileActivation(profileTypes);
  return NextResponse.json({
    profiles: activation.profiles,
    profileLabels: activation.profiles.map(type => ({
      type,
      label: incomeProfileLabels[type],
    })),
    activation,
  });
}

export async function PUT(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const profiles = Array.from(new Set(parsed.data.profiles));

  await prisma.$transaction(async tx => {
    await tx.userIncomeProfile.deleteMany({ where: { userId: session.user.id } });
    await tx.userIncomeProfile.createMany({
      data: profiles.map(type => ({
        userId: session.user.id,
        type,
        isActive: true,
      })),
    });
  });

  const activation = resolveIncomeProfileActivation(profiles);

  await createFinancialEventSafe({
    userId: session.user.id,
    type: FinancialEventType.INCOME_PROFILE_UPDATED,
    source: FinancialEventSource.API_INCOME_PROFILES,
    relatedEntityType: FinancialEntityType.INCOME_PROFILE,
    metadata: {
      profiles,
      activeFeatureCount: activation.features.length,
      activeWorkflowCount: activation.workflowKeys.length,
    },
  });

  return NextResponse.json({
    profiles,
    profileLabels: profiles.map(type => ({
      type,
      label: incomeProfileLabels[type],
    })),
    activation,
  });
}

