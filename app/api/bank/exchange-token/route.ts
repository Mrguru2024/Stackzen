import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exchangePublicToken, fetchPlaidAccounts, fetchPlaidItem } from '@/lib/bank/plaid';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { isPlaidConfigured } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { encryptSensitiveString } from '@/lib/security/encryption';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  BankConnectionStatus,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';

const bodySchema = z
  .object({
    publicToken: z.string().min(10).max(500),
    institution: z.string().max(200).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'plaid_exchange');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: 'Bank linking is not configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const exchange = await exchangePublicToken(parsed.data.publicToken);
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const [itemResponse, accountsResponse] = await Promise.all([
      fetchPlaidItem(accessToken),
      fetchPlaidAccounts(accessToken),
    ]);

    const institutionName =
      parsed.data.institution ??
      accountsResponse.data.item.institution_id ??
      itemResponse.data.item.institution_id ??
      'Linked institution';

    const encryptedAccessToken = encryptSensitiveString(accessToken);
    const accessTokenLast4 = accessToken.slice(-4);

    const connection = await prisma.bankConnection.upsert({
      where: { itemId },
      update: {
        userId: session.user.id,
        provider: 'PLAID',
        status: BankConnectionStatus.ACTIVE,
        institutionId: itemResponse.data.item.institution_id ?? null,
        institutionName,
        accessTokenEncrypted: encryptedAccessToken,
        accessTokenLast4,
        disconnectedAt: null,
      },
      create: {
        userId: session.user.id,
        provider: 'PLAID',
        status: BankConnectionStatus.ACTIVE,
        itemId,
        institutionId: itemResponse.data.item.institution_id ?? null,
        institutionName,
        accessTokenEncrypted: encryptedAccessToken,
        accessTokenLast4,
      },
    });

    for (const account of accountsResponse.data.accounts) {
      await prisma.bankAccount.upsert({
        where: {
          bankConnectionId_providerAccountId: {
            bankConnectionId: connection.id,
            providerAccountId: account.account_id,
          },
        },
        update: {
          userId: session.user.id,
          name: account.name,
          officialName: account.official_name,
          mask: account.mask,
          accountType: account.type,
          accountSubtype: account.subtype ?? null,
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
          currency: account.balances.iso_currency_code ?? 'USD',
          isActive: true,
        },
        create: {
          userId: session.user.id,
          bankConnectionId: connection.id,
          providerAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name,
          mask: account.mask,
          accountType: account.type,
          accountSubtype: account.subtype ?? null,
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
          currency: account.balances.iso_currency_code ?? 'USD',
          isActive: true,
        },
      });
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.BANK_CONNECTED,
      source: FinancialEventSource.API_BANK,
      relatedEntityType: FinancialEntityType.BANK_CONNECTION,
      relatedEntityId: connection.id,
      metadata: {
        institutionName: connection.institutionName,
        provider: connection.provider,
        accountCount: accountsResponse.data.accounts.length,
      },
    });

    return NextResponse.json({
      connectionId: connection.id,
      institutionName: connection.institutionName,
      accountsLinked: accountsResponse.data.accounts.length,
      status: connection.status,
    });
  } catch {
    console.error('[BANK_EXCHANGE_TOKEN] Plaid exchange failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
