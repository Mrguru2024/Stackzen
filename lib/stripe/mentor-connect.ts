import 'server-only';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from './client';
import type { StripeConnectStatus } from './connect';

function mentorReturnUrls(): { returnUrl: string; refreshUrl: string } {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return {
    returnUrl: `${base}/stripe/mentor-connect/return`,
    refreshUrl: `${base}/stripe/mentor-connect/refresh`,
  };
}

async function getMentorByUserId(userId: string) {
  return prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, userId: true, stripeConnectId: true, user: { select: { email: true } } },
  });
}

function deriveCoarseStatus(account: Stripe.Account): StripeConnectStatus['status'] {
  if (!account.details_submitted) return 'onboarding';
  if (account.charges_enabled && account.payouts_enabled) return 'active';
  return 'restricted';
}

export async function ensureMentorConnectedAccount(userId: string): Promise<string> {
  const mentor = await getMentorByUserId(userId);
  if (!mentor) throw new Error('Mentor profile required');
  if (mentor.stripeConnectId) return mentor.stripeConnectId;

  const account = await getStripe().accounts.create({
    type: 'standard',
    email: mentor.user.email ?? undefined,
    metadata: { userId: mentor.userId, mentorId: mentor.id, source: 'stackzen-mentor-payouts' },
  });

  await prisma.mentor.update({
    where: { id: mentor.id },
    data: { stripeConnectId: account.id },
  });

  return account.id;
}

export async function createMentorOnboardingLink(userId: string): Promise<string> {
  const accountId = await ensureMentorConnectedAccount(userId);
  const { returnUrl, refreshUrl } = mentorReturnUrls();

  const link = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
    collection_options: { fields: 'eventually_due' },
  });

  if (!link.url) throw new Error('Stripe did not return an onboarding URL');
  return link.url;
}

export async function syncMentorConnectedAccount(userId: string): Promise<StripeConnectStatus> {
  const mentor = await getMentorByUserId(userId);
  if (!mentor?.stripeConnectId) {
    return {
      connected: false,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      status: 'not_connected',
      pendingRequirements: [],
    };
  }

  const account = await getStripe().accounts.retrieve(mentor.stripeConnectId);
  const coarse = deriveCoarseStatus(account);
  const pending = [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.eventually_due ?? []),
  ];

  return {
    connected: true,
    accountId: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    status: coarse,
    disabledReason: account.requirements?.disabled_reason ?? null,
    pendingRequirements: Array.from(new Set(pending)),
  };
}

export async function getMentorConnectCachedStatus(userId: string): Promise<StripeConnectStatus> {
  const mentor = await getMentorByUserId(userId);
  if (!mentor?.stripeConnectId) {
    return {
      connected: false,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      status: 'not_connected',
      pendingRequirements: [],
    };
  }

  return {
    connected: true,
    accountId: mentor.stripeConnectId,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    status: 'onboarding',
    pendingRequirements: [],
  };
}

/** True when session payments can split to the mentor's Connect account. */
export async function mentorCanReceiveSessionPayouts(mentorId: string): Promise<{
  ok: boolean;
  accountId: string | null;
}> {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    select: { stripeConnectId: true },
  });
  if (!mentor?.stripeConnectId) return { ok: false, accountId: null };

  try {
    const account = await getStripe().accounts.retrieve(mentor.stripeConnectId);
    const ok = Boolean(account.charges_enabled && account.payouts_enabled);
    return { ok, accountId: mentor.stripeConnectId };
  } catch {
    return { ok: false, accountId: mentor.stripeConnectId };
  }
}
