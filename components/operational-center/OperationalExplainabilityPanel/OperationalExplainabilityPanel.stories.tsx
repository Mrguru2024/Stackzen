import type { Meta, StoryObj } from '@storybook/react';
import { OperationalExplainabilityPanel } from '@/components/operational-center/OperationalExplainabilityPanel';
import type { OperationalExplainabilityDto } from '@/lib/explainability/types';

const sample: OperationalExplainabilityDto = {
  version: 1,
  notificationId: 'story-n1',
  attentionKind: 'guidance_story',
  lifecycle: { primary: 'acknowledged', readAt: new Date().toISOString() },
  blocks: [
    {
      kind: 'cashflow_risk',
      riskCode: 'BILL_CLUSTER',
      confidence: 0.65,
      summary: 'Several bills land before income.',
      detail: 'Cluster window May 12–14.',
    },
    {
      kind: 'trust_reference',
      why: 'Forecast obligations vs income.',
      recommendedNextStep: 'Open Cash Flow.',
      sourceEventType: 'CASHFLOW_RISK_DETECTED',
    },
  ],
  auditTrail: [],
};

const meta: Meta<typeof OperationalExplainabilityPanel> = {
  title: 'Operational / Explainability panel',
  component: OperationalExplainabilityPanel,
};
export default meta;

type Story = StoryObj<typeof OperationalExplainabilityPanel>;

export const Default: Story = {
  args: { explainability: sample },
};
