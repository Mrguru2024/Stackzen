import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export type AiPrivacySettings = {
  aiConsentAt: Date | null;
  aiMemoryEnabled: boolean;
  aiOptOut: boolean;
};

export async function getAiPrivacySettings(userId: string): Promise<AiPrivacySettings> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      aiConsentAt: true,
      aiMemoryEnabled: true,
      aiOptOut: true,
    },
  });

  return {
    aiConsentAt: settings?.aiConsentAt ?? null,
    aiMemoryEnabled: settings?.aiMemoryEnabled ?? false,
    aiOptOut: settings?.aiOptOut ?? false,
  };
}

export async function grantAiConsent(userId: string): Promise<AiPrivacySettings> {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      aiConsentAt: new Date(),
      aiMemoryEnabled: false,
      aiOptOut: false,
    },
    update: {
      aiConsentAt: new Date(),
      aiOptOut: false,
    },
    select: {
      aiConsentAt: true,
      aiMemoryEnabled: true,
      aiOptOut: true,
    },
  });

  return settings;
}

/**
 * Returns a 403 response when AI features must not run; otherwise null.
 */
export async function requireAiConsent(userId: string): Promise<NextResponse | null> {
  const privacy = await getAiPrivacySettings(userId);

  if (privacy.aiOptOut) {
    return NextResponse.json(
      {
        error: 'AI features are disabled for this account',
        code: 'AI_OPT_OUT',
      },
      { status: 403 }
    );
  }

  if (!privacy.aiConsentAt) {
    return NextResponse.json(
      {
        error: 'AI consent is required before using StackZen AI features',
        code: 'AI_CONSENT_REQUIRED',
      },
      { status: 403 }
    );
  }

  return null;
}
