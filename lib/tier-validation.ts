import { prisma } from '@/lib/prisma';

export type SubscriptionLevel = 'FREE' | 'PRO' | 'LIFETIME' | 'ZEN_PLUS';

export interface TierRequirement {
  plan: string;
  requiresProOrZen?: boolean;
  availableToAll?: boolean;
}

// Define which plans require specific tier levels
export const PLAN_TIER_REQUIREMENTS: Record<string, TierRequirement> = {
  FREE: { plan: 'FREE', availableToAll: true },
  PRO: { plan: 'PRO', availableToAll: true },
  LIFETIME: { plan: 'LIFETIME', availableToAll: true },
  ZEN_PLUS: { plan: 'ZEN_PLUS', requiresProOrZen: true },
  COACHING_SESSION: { plan: 'COACHING_SESSION', availableToAll: true },
};

/**
 * Check if a user can access a specific plan or feature
 */
export async function canUserAccessPlan(
  userId: string,
  planKey: string
): Promise<{ canAccess: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionLevel: true },
  });

  if (!user) {
    return { canAccess: false, reason: 'User not found' };
  }

  const requirement = PLAN_TIER_REQUIREMENTS[planKey];
  if (!requirement) {
    return { canAccess: false, reason: 'Invalid plan' };
  }

  // Plans available to all users
  if (requirement.availableToAll) {
    return { canAccess: true };
  }

  // Plans that require Pro or Zen Access
  if (requirement.requiresProOrZen) {
    if (user.subscriptionLevel === 'PRO' || user.subscriptionLevel === 'LIFETIME') {
      return { canAccess: true };
    } else {
      return {
        canAccess: false,
        reason:
          'This plan requires Pro or Zen Access subscription. Please upgrade your plan first.',
      };
    }
  }

  return { canAccess: true };
}

/**
 * Get all plans a user can access
 */
export async function getUserAccessiblePlans(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionLevel: true },
  });

  if (!user) {
    return ['FREE', 'PRO', 'LIFETIME', 'COACHING_SESSION']; // Default accessible plans
  }

  const accessiblePlans: string[] = ['FREE', 'PRO', 'LIFETIME', 'COACHING_SESSION'];

  // Add Zen+ Coaching if user has Pro or Zen Access
  if (user.subscriptionLevel === 'PRO' || user.subscriptionLevel === 'LIFETIME') {
    accessiblePlans.push('ZEN_PLUS');
  }

  return accessiblePlans;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  userSubscriptionLevel: SubscriptionLevel,
  feature: string
): boolean {
  const featureAccess: Record<string, SubscriptionLevel[]> = {
    'basic-budgeting': ['FREE', 'PRO', 'LIFETIME', 'ZEN_PLUS'],
    'advanced-analytics': ['PRO', 'LIFETIME', 'ZEN_PLUS'],
    'bank-sync': ['PRO', 'LIFETIME', 'ZEN_PLUS'],
    invoicing: ['PRO', 'LIFETIME', 'ZEN_PLUS'],
    'zen-ai-insights': ['LIFETIME', 'ZEN_PLUS'],
    'coaching-portal': ['ZEN_PLUS'],
    'priority-support': ['PRO', 'LIFETIME', 'ZEN_PLUS'],
    'mentor-consultations': ['FREE', 'PRO', 'LIFETIME', 'ZEN_PLUS'],
  };

  const requiredLevels = featureAccess[feature];
  return requiredLevels ? requiredLevels.includes(userSubscriptionLevel) : false;
}
