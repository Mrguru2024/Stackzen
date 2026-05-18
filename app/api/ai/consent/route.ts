import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { grantAiConsent, getAiPrivacySettings } from '@/lib/ai/consent';
import { logAiInteraction } from '@/lib/ai/memory';
import { logSafeError } from '@/lib/security/safe-log';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const privacy = await getAiPrivacySettings(session.user.id);
    return NextResponse.json(privacy);
  } catch (error) {
    logSafeError('AI_CONSENT_GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const privacy = await grantAiConsent(session.user.id);
    await logAiInteraction({
      userId: session.user.id,
      action: 'ai.consent_granted',
      details: { aiConsentAt: privacy.aiConsentAt?.toISOString() },
    });
    return NextResponse.json(privacy);
  } catch (error) {
    logSafeError('AI_CONSENT_POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
