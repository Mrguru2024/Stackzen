import { prisma } from './prisma';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  trialExpiresAt: Date | null;
  trialStartedAt: Date | null;
  isExpired: boolean;
}

/**
 * Get trial status for a user
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialStartedAt: true,
      trialExpiresAt: true,
      isTrialActive: true,
      subscriptionLevel: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // If user has a paid subscription, trial is not relevant
  if (user.subscriptionLevel !== 'FREE') {
    return {
      isActive: false,
      daysRemaining: 0,
      trialExpiresAt: user.trialExpiresAt,
      trialStartedAt: user.trialStartedAt,
      isExpired: false,
    };
  }

  const _now = new Date();
  const trialExpiresAt = user.trialExpiresAt;
  const isExpired = trialExpiresAt ? _now > trialExpiresAt : false;
  const isActive = user.isTrialActive && !isExpired;

  let daysRemaining = 0;
  if (trialExpiresAt && !isExpired) {
    const _diffTime = trialExpiresAt.getTime() - _now.getTime();
    daysRemaining = Math.ceil(_diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isActive: isActive,
    daysRemaining: daysRemaining,
    trialExpiresAt: trialExpiresAt,
    trialStartedAt: user.trialStartedAt,
    isExpired: isExpired,
  };
}

/**
 * Check if user has access to features based on trial/subscription status
 */
export async function hasFeatureAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionLevel: true,
      isTrialActive: true,
      trialExpiresAt: true,
    },
  });

  if (!user) {
    return false;
  }

  // If user has a paid subscription, they have access
  if (user.subscriptionLevel !== 'FREE') {
    return true;
  }

  // For free users, check if trial is active
  if (user.isTrialActive && user.trialExpiresAt && new Date() < user.trialExpiresAt) {
    return true;
  }

  // Trial expired or not active
  return false;
}

/**
 * Update trial status (called by cron job or webhook)
 */
export async function updateTrialStatus(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialExpiresAt: true,
      isTrialActive: true,
    },
  });

  if (!user) {
    return;
  }

  const _now = new Date();
  const isExpired = user.trialExpiresAt ? _now > user.trialExpiresAt : false;

  if (isExpired && user.isTrialActive) {
    await prisma.user.update({
      where: { id: userId },
      data: { isTrialActive: false },
    });
  }
}

/**
 * Get users with expired trials
 */
export async function getExpiredTrials(): Promise<string[]> {
  const _now = new Date();

  const _expiredUsers = await prisma.user.findMany({
    where: {
      subscriptionLevel: 'FREE',
      trialExpiresAt: {
        lt: _now,
      },
      isTrialActive: true,
    },
    select: {
      id: true,
    },
  });

  return _expiredUsers.map(user => user.id);
}

/**
 * Create Stripe checkout session for trial upgrade
 */
export async function createTrialUpgradeSession(userId: string, country?: string, state?: string) {
  const { createCheckoutSession } = await import('@/lib/stripe/actions');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return createCheckoutSession({
    userId,
    email: user.email!,
    plan: 'FREE', // This will be the Starter plan after trial
    cycle: 'monthly',
    country,
    state,
  });
}
