export const WELLNESS_CATEGORIES = [
  'Physical',
  'Mental',
  'Financial',
  'Social',
  'Career',
  'Environmental',
  'Spiritual',
] as const;

export type WellnessCategory = (typeof WELLNESS_CATEGORIES)[number];

export const _CATEGORY_COLORS = {
  Physical: '#FF6B6B',
  Mental: '#4ECDC4',
  Financial: '#45B7D1',
  Social: '#96CEB4',
  Career: '#FFEEAD',
  Environmental: '#D4A5A5',
  Spiritual: '#9B59B6',
} as const;
