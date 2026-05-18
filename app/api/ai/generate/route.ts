import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { withAuthZod, withRateLimit } from '@/lib/api/with-security';
import type { AuthedSession } from '@/lib/api/require-auth';
import { requireAiConsent } from '@/lib/ai/consent';
import { orchestrateAi } from '@/lib/ai/router';
import { aiGeneratePostSchema } from '@/lib/validation/ai';
import { verifyTurnstileForRequest } from '@/lib/security/turnstile';
import { logSafeError } from '@/lib/security/safe-log';
import { isAiFeaturesEnabled } from '@/lib/ai/config';

async function postGenerate(
  request: Request,
  ctx: { session: AuthedSession; body: z.infer<typeof aiGeneratePostSchema> }
) {
  if (!isAiFeaturesEnabled()) {
    return NextResponse.json(
      { error: 'AI features are disabled', code: 'AI_DISABLED' },
      { status: 503 }
    );
  }

  const consentBlock = await requireAiConsent(ctx.session.user.id);
  if (consentBlock) return consentBlock;

  const turnstile = await verifyTurnstileForRequest(request, ctx.body.turnstileToken);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error, code: 'TURNSTILE_FAILED' }, { status: 400 });
  }

  try {
    const result = await orchestrateAi({
      userId: ctx.session.user.id,
      message: ctx.body.message,
      task: ctx.body.task,
      sessionId: ctx.body.sessionId,
      context: ctx.body.context,
    });

    if (!result.ok && result.blocked) {
      return NextResponse.json(
        {
          response: result.response,
          code: result.code,
          blocked: true,
        },
        { status: 400 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code, blocked: false },
        { status: 503 }
      );
    }

    return NextResponse.json({
      response: result.response.text,
      provider: result.response.provider,
      model: result.response.model,
      policyApplied: result.response.policyApplied,
      fallbackUsed: result.response.fallbackUsed,
      blocked: false,
    });
  } catch (error) {
    logSafeError('AI_GENERATE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit('ai_chat')(withAuthZod(aiGeneratePostSchema, postGenerate));
