import { prisma } from '@/lib/prisma';

export type UserTier = 'FREE' | 'PRO' | 'LIFETIME' | 'ZEN_PLUS' | 'COACHING_SESSION';

export interface TierValidationResult {
  hasAccess: boolean;
  message?: string;
  requiredTier?: UserTier;
}

/**
 * Validates if a user has access to a specific feature or plan
 */
export async function validateTierAccess(
  userId: string,
  requiredFeature: 'zen_plus_coaching' | 'coaching_session' | 'pro_features' | 'zen_features'
): Promise<TierValidationResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionLevel: true },
  });

  if (!user) {
    return {
      hasAccess: false,
      message: 'User not found',
    };
  }

  const userTier = user.subscriptionLevel as UserTier;

  switch (requiredFeature) {
    case 'zen_plus_coaching':
      if (userTier === 'PRO' || userTier === 'LIFETIME') {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        message:
          'Zen+ Coaching is only available to Pro or Zen Access users. Please upgrade your plan first.',
        requiredTier: 'PRO',
      };

    case 'coaching_session':
      // 1-on-1 coaching sessions are available to all users
      return { hasAccess: true };

    case 'pro_features':
      if (userTier === 'PRO' || userTier === 'LIFETIME' || userTier === 'ZEN_PLUS') {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        message: 'This feature requires a Pro plan or higher.',
        requiredTier: 'PRO',
      };

    case 'zen_features':
      if (userTier === 'LIFETIME' || userTier === 'ZEN_PLUS') {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        message: 'This feature requires Zen Access or Zen+ Coaching.',
        requiredTier: 'LIFETIME',
      };

    default:
      return {
        hasAccess: false,
        message: 'Invalid feature requested',
      };
  }
}

/**
 * Gets the user's current tier level
 */
export async function getUserTier(userId: string): Promise<UserTier | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionLevel: true },
  });

  return (user?.subscriptionLevel as UserTier) || null;
}

/**
 * Checks if a user can upgrade to a specific tier
 */
export function canUpgradeToTier(currentTier: UserTier, targetTier: UserTier): boolean {
  const tierHierarchy: Record<UserTier, number> = {
    FREE: 0,
    PRO: 1,
    LIFETIME: 2,
    ZEN_PLUS: 3,
    COACHING_SESSION: 0, // Special case - available to all
  };

  // Special case for coaching session - always available
  if (targetTier === 'COACHING_SESSION') {
    return true;
  }

  // Special case for Zen+ Coaching - only available to PRO or LIFETIME
  if (targetTier === 'ZEN_PLUS') {
    return currentTier === 'PRO' || currentTier === 'LIFETIME';
  }

  return tierHierarchy[currentTier] < tierHierarchy[targetTier];
}

/**
 * Gets the upgrade path for a user
 */
export function getUpgradePath(currentTier: UserTier): UserTier[] {
  const availableUpgrades: Record<UserTier, UserTier[]> = {
    FREE: ['PRO', 'LIFETIME', 'COACHING_SESSION'],
    PRO: ['LIFETIME', 'ZEN_PLUS', 'COACHING_SESSION'],
    LIFETIME: ['ZEN_PLUS', 'COACHING_SESSION'],
    ZEN_PLUS: ['COACHING_SESSION'],
    COACHING_SESSION: [],
  };

  return availableUpgrades[currentTier] || [];
}
