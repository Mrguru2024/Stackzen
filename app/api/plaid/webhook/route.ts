import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { FinancialEntityType, FinancialEventSource, FinancialEventType } from '@prisma/client';

export async function POST(request: Request) {
  const expectedVerification = process.env.PLAID_WEBHOOK_VERIFICATION_KEY?.trim();
  if (expectedVerification) {
    const provided = request.headers.get('x-plaid-webhook-verification')?.trim();
    if (!provided || provided !== expectedVerification) {
      return NextResponse.json({ error: 'Invalid webhook verification header' }, { status: 401 });
    }
  }

  const signingSecret = process.env.PLAID_WEBHOOK_SIGNING_SECRET?.trim();

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (signingSecret) {
    const signature = request.headers.get('x-plaid-signature')?.trim();
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    const computed = createHmac('sha256', signingSecret).update(rawBody).digest('hex');
    const signatureBuf = Buffer.from(signature, 'hex');
    const computedBuf = Buffer.from(computed, 'hex');
    if (
      signatureBuf.length !== computedBuf.length ||
      !timingSafeEqual(signatureBuf, computedBuf)
    ) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const itemId = typeof data.item_id === 'string' ? data.item_id : null;
  if (!itemId) {
    return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
  }

  const connection = await prisma.bankConnection.findUnique({
    where: { itemId },
    select: { id: true, userId: true },
  });
  if (!connection) {
    return NextResponse.json({ ok: true });
  }

  await createFinancialEventSafe({
    userId: connection.userId,
    type: FinancialEventType.BANK_SYNC_COMPLETED,
    source: FinancialEventSource.API_BANK,
    relatedEntityType: FinancialEntityType.BANK_CONNECTION,
    relatedEntityId: connection.id,
    metadata: {
      webhookType: data.webhook_type ?? null,
      webhookCode: data.webhook_code ?? null,
      note: 'Webhook received; sync job queued.',
    },
  });

  await prisma.bankSyncJob.create({
    data: {
      userId: connection.userId,
      bankConnectionId: connection.id,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ ok: true });
}
