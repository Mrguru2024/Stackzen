import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { requireAiConsent } from '@/lib/ai/consent';
import { getMoneyMentorHistory } from '@/lib/ai/money-mentor-service';
import { logSafeError } from '@/lib/security/safe-log';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const consentBlock = await requireAiConsent(session.user.id);
  if (consentBlock) return consentBlock;

  try {
    const data = await getMoneyMentorHistory(session.user.id);
    return NextResponse.json({
      messages: data.messages,
      context: data.context,
      privacy: {
        aiMemoryEnabled: data.privacy.aiMemoryEnabled,
        aiOptOut: data.privacy.aiOptOut,
        aiConsentAt: data.privacy.aiConsentAt,
      },
    });
  } catch (error) {
    logSafeError('MONEY_MENTOR_HISTORY', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
