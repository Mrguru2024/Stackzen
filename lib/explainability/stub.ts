import type { OperationalExplainabilityDto } from '@/lib/explainability/types';

/** Minimal explainability for tests and Storybook when full API payload is not built. */
export function stubOperationalExplainability(notificationId: string): OperationalExplainabilityDto {
  return {
    version: 1,
    notificationId,
    lifecycle: { primary: 'active', readAt: null },
    blocks: [
      {
        kind: 'trust_reference',
        why: '',
        recommendedNextStep: '',
      },
    ],
    auditTrail: [],
  };
}
