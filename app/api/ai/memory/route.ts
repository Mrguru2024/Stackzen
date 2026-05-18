import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { requireAiConsent } from '@/lib/ai/consent';
import { clearAiMemory } from '@/lib/ai/memory';
import { logSafeError } from '@/lib/security/safe-log';

/** DELETE — remove stored AI chat memory for the current user. */
export async function DELETE() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const consentBlock = await requireAiConsent(session.user.id);
  if (consentBlock) return consentBlock;

  try {
    const result = await clearAiMemory(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    logSafeError('AI_MEMORY_DELETE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
