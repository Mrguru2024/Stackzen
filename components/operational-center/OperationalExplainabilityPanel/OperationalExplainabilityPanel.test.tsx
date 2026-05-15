/* @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OperationalExplainabilityPanel } from '@/components/operational-center/OperationalExplainabilityPanel';
import type { OperationalExplainabilityDto } from '@/lib/explainability/types';

const sample: OperationalExplainabilityDto = {
  version: 1,
  notificationId: 'nid',
  attentionKind: 'guidance_demo',
  lifecycle: {
    primary: 'active',
    readAt: null,
  },
  blocks: [
    {
      kind: 'guidance_engine',
      logicalKind: 'BILL_TIMING',
      priority: 'medium',
      riskCode: null,
      calculations: ['Test calculation'],
      inputsUsed: { k: 1 },
      confidence: 0.5,
      expectedImpact: 'Pay early bills first.',
      engineVersion: 1,
    },
    {
      kind: 'trust_reference',
      why: 'Engine recommendation',
      recommendedNextStep: 'Apply or dismiss',
      sourceEventType: 'GUIDANCE_ENGINE_SYNCED',
    },
  ],
  auditTrail: [
    {
      id: 'e1',
      type: 'GUIDANCE_ENGINE_SYNCED',
      source: 'API_GUIDANCE',
      createdAt: new Date().toISOString(),
      metadata: { keys: ['a'] },
    },
  ],
};

describe('OperationalExplainabilityPanel', () => {
  it('renders lifecycle, reasoning blocks, and linked events', () => {
    render(<OperationalExplainabilityPanel explainability={sample} />);

    expect(screen.getByText(/Operational audit trail/i)).toBeInTheDocument();
    expect(screen.getByText(/guidance engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Test calculation/i)).toBeInTheDocument();
    expect(screen.getByText(/Linked FinancialEvents/i)).toBeInTheDocument();
    expect(screen.getAllByText(/GUIDANCE_ENGINE_SYNCED/i).length).toBeGreaterThanOrEqual(1);
  });
});
