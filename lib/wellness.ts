export const WELLNESS_CATEGORIES = [
  'Physical',
  'Mental',
  'Financial',
  'Social',
  'Environmental',
  'Spiritual',
] as const;

export type WellnessCategory = (typeof WELLNESS_CATEGORIES)[number];

export interface WellnessGoal {
  id: string;
  category: WellnessCategory;
  title: string;
  description: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
}
