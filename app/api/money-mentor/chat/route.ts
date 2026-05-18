import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { withAuthZod, withRateLimit } from '@/lib/api/with-security';
import type { AuthedSession } from '@/lib/api/require-auth';
import { moneyMentorPostSchema } from '@/lib/validation/ai';
import { requireAiConsent } from '@/lib/ai/consent';
import { handleMoneyMentorChat } from '@/lib/ai/money-mentor-service';
import { verifyTurnstileForRequest } from '@/lib/security/turnstile';
import { logSafeError } from '@/lib/security/safe-log';

async function postChat(
  request: Request,
  ctx: { session: AuthedSession; body: z.infer<typeof moneyMentorPostSchema> }
) {
  const consentBlock = await requireAiConsent(ctx.session.user.id);
  if (consentBlock) return consentBlock;

  const turnstile = await verifyTurnstileForRequest(request, ctx.body.turnstileToken);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error, code: 'TURNSTILE_FAILED' }, { status: 400 });
  }

  try {
    const result = await handleMoneyMentorChat(
      ctx.session,
      ctx.body.message,
      ctx.body.context
    );

    if (result.blocked) {
      return NextResponse.json(
        { response: result.response, code: result.code, blocked: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      response: result.response,
      updatedContext: result.updatedContext,
      policyApplied: result.policyApplied,
    });
  } catch (error) {
    logSafeError('MONEY_MENTOR_CHAT', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit('ai_chat')(withAuthZod(moneyMentorPostSchema, postChat));
