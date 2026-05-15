export const _WELLNESS_CATEGORIES = {
  PHYSICAL: 'physical',
  MENTAL: 'mental',
  FINANCIAL: 'financial',
  SOCIAL: 'social',
  CAREER: 'career',
} as const;

export const _WELLNESS_CATEGORY_VALUES = Object.values(_WELLNESS_CATEGORIES);

export const _WELLNESS_CATEGORY_LABELS = {
  [_WELLNESS_CATEGORIES.PHYSICAL]: 'Physical Wellness',
  [_WELLNESS_CATEGORIES.MENTAL]: 'Mental Wellness',
  [_WELLNESS_CATEGORIES.FINANCIAL]: 'Financial Wellness',
  [_WELLNESS_CATEGORIES.SOCIAL]: 'Social Wellness',
  [_WELLNESS_CATEGORIES.CAREER]: 'Career Wellness',
} as const;

export const _WELLNESS_GOALS = {
  [_WELLNESS_CATEGORIES.PHYSICAL]: [
    'Exercise regularly',
    'Maintain healthy diet',
    'Get enough sleep',
    'Stay hydrated',
  ],
  [_WELLNESS_CATEGORIES.MENTAL]: [
    'Practice mindfulness',
    'Manage stress',
    'Maintain work-life balance',
    'Develop coping strategies',
  ],
  [_WELLNESS_CATEGORIES.FINANCIAL]: [
    'Create emergency fund',
    'Pay off debt',
    'Save for retirement',
    'Invest wisely',
  ],
  [_WELLNESS_CATEGORIES.SOCIAL]: [
    'Build strong relationships',
    'Join community groups',
    'Volunteer regularly',
    'Maintain work relationships',
  ],
  [_WELLNESS_CATEGORIES.CAREER]: [
    'Learn new skills',
    'Set career goals',
    'Network effectively',
    'Find work-life balance',
  ],
} as const;

export const _WELLNESS_RECOMMENDATIONS = {
  [_WELLNESS_CATEGORIES.PHYSICAL]: [
    'Start with 30 minutes of exercise daily',
    'Include more fruits and vegetables in your diet',
    'Aim for 7-8 hours of sleep each night',
    'Drink at least 8 glasses of water daily',
  ],
  [_WELLNESS_CATEGORIES.MENTAL]: [
    'Try meditation for 10 minutes daily',
    'Practice deep breathing exercises',
    'Take regular breaks during work',
    'Keep a gratitude journal',
  ],
  [_WELLNESS_CATEGORIES.FINANCIAL]: [
    'Set up automatic savings',
    'Create a budget and track expenses',
    'Start investing in index funds',
    'Review and optimize insurance coverage',
  ],
  [_WELLNESS_CATEGORIES.SOCIAL]: [
    'Schedule regular catch-ups with friends',
    'Join a local club or group',
    'Participate in community events',
    'Maintain professional connections',
  ],
  [_WELLNESS_CATEGORIES.CAREER]: [
    'Take online courses in your field',
    'Set quarterly career goals',
    'Attend industry events',
    'Find a mentor',
  ],
} as const;
