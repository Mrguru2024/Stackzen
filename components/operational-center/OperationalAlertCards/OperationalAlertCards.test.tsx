/* @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OperationalAlertCards } from '@/components/operational-center/OperationalAlertCards';
import type { OperationalAlertDto } from '@/lib/operational-notifications/types';
import {
  AutomationNotificationType,
  FinancialEntityType,
  NotificationSeverity,
} from '@prisma/client';
import { stubOperationalExplainability } from '@/lib/explainability/stub';

const sampleAlerts: OperationalAlertDto[] = [
  {
    id: 'clj9qjq7n000508l6h7qk3zq4',
    automationType: AutomationNotificationType.OVERSPENDING_ALERT,
    domain: 'financial',
    uiPriority: 'critical',
    severity: NotificationSeverity.CRITICAL,
    title: 'Guardrail breached',
    body: 'You have exceeded the monthly cap.',
    createdAt: new Date().toISOString(),
    readAt: null,
    inAttentionQueue: true,
    suppressed: false,
    relatedEntityType: FinancialEntityType.GUARDRAIL,
    relatedEntityId: 'clj9qjq7n010508l6h7qk3zq5',
    actions: [{ type: 'REVIEW_TRANSACTION', financialTransactionId: 'clj9qjq7n020508l6h7qk3zq6' }],
    trust: {
      why: 'Spend crossed the configured limit.',
      recommendedNextStep: 'Review the latest categorized transaction.',
    },
    dedupeKey: 'entity:GUARDRAIL:clj9qjq7n010508l6h7qk3zq5',
    explainability: {
      ...stubOperationalExplainability('clj9qjq7n000508l6h7qk3zq4'),
      blocks: [
        {
          kind: 'trust_reference',
          why: 'Spend crossed the configured limit.',
          recommendedNextStep: 'Review the latest categorized transaction.',
        },
      ],
    },
  },
];

describe('OperationalAlertCards', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({}) })
    ) as unknown as jest.Mock;
  });

  it('shows trust copy and transactional review links', () => {
    render(<OperationalAlertCards items={sampleAlerts} onMutate={jest.fn()} compactTrust={false} />);

    expect(screen.getByText('Guardrail breached')).toBeInTheDocument();
    expect(screen.getAllByText(/Spend crossed the configured limit/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /Review transaction/i })).toHaveAttribute(
      'href',
      `/money-control?tab=review&txnId=${encodeURIComponent('clj9qjq7n020508l6h7qk3zq6')}`
    );
  });

  it('runs mark-read PATCH when requested', async () => {
    const onMutate = jest.fn(async () => {});

    render(<OperationalAlertCards items={sampleAlerts} onMutate={onMutate} />);

    fireEvent.click(screen.getByRole('button', { name: /Mark read/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/automation/notifications/${sampleAlerts[0].id}`,
        expect.objectContaining({ method: 'PATCH' })
      )
    );

    await waitFor(() => expect(onMutate).toHaveBeenCalled());
  });

  it('omits explanation blocks when compactTrust is enabled', () => {
    render(<OperationalAlertCards items={sampleAlerts} onMutate={jest.fn()} compactTrust />);

    expect(screen.queryByText(/Why:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Operational audit trail/i)).not.toBeInTheDocument();
  });
});
