import 'server-only';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from './client';

/**
 * Public, UI-friendly summary of a user's Stripe Connect status.
 *
 * Designed to drive the StripeConnectCard component and to keep the front-end
 * unaware of the underlying Stripe API surface.
 */
export type StripeConnectStatus = {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** Coarse status: 'not_connected' | 'onboarding' | 'restricted' | 'active' */
  status: 'not_connected' | 'onboarding' | 'restricted' | 'active';
  /** Reason a Stripe account is currently restricted, e.g. additional KYC. */
  disabledReason?: string | null;
  /** Pending requirements summary; used to nudge users to finish onboarding. */
  pendingRequirements: string[];
};

function getReturnUrls(): { returnUrl: string; refreshUrl: string } {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return {
    returnUrl: `${base}/stripe/connect/return`,
    refreshUrl: `${base}/stripe/connect/refresh`,
  };
}

/**
 * Idempotently creates a Stripe Standard Connected Account for the user
 * (Standard = the user has full Stripe Dashboard access; we never see card
 * data and Stripe handles all KYC/compliance — perfect for non-developers).
 */
export async function ensureConnectedAccount(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeAccountId: true },
  });
  if (!user) throw new Error('User not found');
  if (user.stripeAccountId) return user.stripeAccountId;

  const account = await getStripe().accounts.create({
    type: 'standard',
    email: user.email ?? undefined,
    metadata: { userId: user.id, source: 'stackzen' },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountId: account.id,
      stripeAccountConnectedAt: new Date(),
      stripeAccountStatus: 'onboarding',
      stripeAccountSyncedAt: new Date(),
    },
  });
  return account.id;
}

/**
 * Generates a one-time Stripe-hosted onboarding URL. We never embed Stripe's
 * KYC inside our app — Stripe owns the entire flow and any upgrades.
 */
export async function createOnboardingLink(userId: string): Promise<string> {
  const accountId = await ensureConnectedAccount(userId);
  const { returnUrl, refreshUrl } = getReturnUrls();

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

function deriveCoarseStatus(account: Stripe.Account): StripeConnectStatus['status'] {
  if (!account.details_submitted) return 'onboarding';
  if (account.charges_enabled && account.payouts_enabled) return 'active';
  return 'restricted';
}

/**
 * Pulls the latest connection state from Stripe and writes it back to the DB.
 * Safe to call frequently from the UI; Stripe handles any rate-limiting.
 */
export async function syncConnectedAccount(userId: string): Promise<StripeConnectStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });

  if (!user?.stripeAccountId) {
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

  const account = await getStripe().accounts.retrieve(user.stripeAccountId);
  const coarse = deriveCoarseStatus(account);
  const pending = [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.eventually_due ?? []),
  ];

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeChargesEnabled: account.charges_enabled,
      stripePayoutsEnabled: account.payouts_enabled,
      stripeDetailsSubmitted: account.details_submitted,
      stripeAccountStatus: coarse,
      stripeAccountSyncedAt: new Date(),
    },
  });

  return {
    connected: true,
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    status: coarse,
    disabledReason: account.requirements?.disabled_reason ?? null,
    pendingRequirements: Array.from(new Set(pending)),
  };
}

/**
 * Returns the cached DB status without touching Stripe. Use for fast renders.
 */
export async function getCachedStatus(userId: string): Promise<StripeConnectStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
      stripeDetailsSubmitted: true,
      stripeAccountStatus: true,
    },
  });

  if (!user?.stripeAccountId) {
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

  const status = (user.stripeAccountStatus as StripeConnectStatus['status']) ?? 'onboarding';
  return {
    connected: true,
    accountId: user.stripeAccountId,
    chargesEnabled: user.stripeChargesEnabled,
    payoutsEnabled: user.stripePayoutsEnabled,
    detailsSubmitted: user.stripeDetailsSubmitted,
    status,
    pendingRequirements: [],
  };
}

/**
 * Soft-disconnect: drops our pointer to the Stripe account. The Stripe account
 * itself continues to exist (it belongs to the user, not to StackZen) — they
 * can re-link it later with a single click.
 */
export async function disconnectAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: null,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeDetailsSubmitted: false,
      stripeAccountStatus: 'not_connected',
      stripeAccountSyncedAt: new Date(),
    },
  });
}
