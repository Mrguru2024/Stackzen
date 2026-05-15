/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import RuleTemplateGallery from './index';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const TEMPLATES = [
  {
    id: 'BUDGET_SPLIT_50_30_20',
    category: 'BUDGET',
    title: '50 / 30 / 20 budget split',
    summary: 'Split every deposit into needs, wants, and savings buckets.',
    guidance: 'Every income deposit is split automatically. Turn it off anytime.',
    outcomes: ['Needs grows by 50%.', 'Wants grows by 30%.', 'Savings grows by 20%.'],
    premium: false,
    badge: 'POPULAR' as const,
    locked: false,
    inputs: [],
  },
  {
    id: 'BUDGET_SPLIT_CUSTOM',
    category: 'BUDGET',
    title: 'Custom budget split',
    summary: 'Define your own envelopes.',
    guidance: 'Pick envelopes and percentages totaling 100%.',
    outcomes: [],
    premium: true,
    badge: 'PRO' as const,
    locked: true,
    inputs: [
      {
        id: 'allocationsCustom',
        label: 'Envelopes & percentages',
        kind: 'allocations' as const,
        defaultValue: [
          { bucket: 'needs', percent: 50 },
          { bucket: 'wants', percent: 30 },
          { bucket: 'savings', percent: 20 },
        ],
      },
    ],
  },
  {
    id: 'CATEGORY_GUARDRAIL',
    category: 'GUARDRAIL',
    title: 'Spending guardrail',
    summary: 'Get warned before you blow past a monthly category cap.',
    guidance: 'Set a monthly limit and warning threshold.',
    outcomes: [],
    premium: false,
    locked: false,
    inputs: [
      {
        id: 'guardrailCategory',
        label: 'Category name',
        kind: 'text' as const,
        placeholder: 'FOOD',
      },
      {
        id: 'guardrailLimit',
        label: 'Monthly limit (USD)',
        kind: 'number' as const,
        defaultValue: 400,
      },
      {
        id: 'guardrailWarnAt',
        label: 'Warn at percent of limit',
        kind: 'number' as const,
        defaultValue: 80,
      },
    ],
  },
];

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ subscriptionLevel: 'FREE', templates: TEMPLATES }),
    } as Response)
  );
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('RuleTemplateGallery', () => {
  it('renders templates grouped by category with Pro badges and locked indicators', async () => {
    render(<RuleTemplateGallery />);
    await waitFor(() => screen.getByText('50 / 30 / 20 budget split'));
    expect(screen.getByText('Budget splits')).toBeInTheDocument();
    expect(screen.getByText('Spending guardrails')).toBeInTheDocument();
    expect(screen.getByText('Requires Pro')).toBeInTheDocument();
  });

  it('opens a builder sheet on click and posts a configured guardrail template', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptionLevel: 'FREE', templates: TEMPLATES }),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'rule-1' }),
    } as Response);

    render(<RuleTemplateGallery />);
    await waitFor(() => screen.getByText('Spending guardrail'));

    await act(async () => {
      fireEvent.click(screen.getByText('Spending guardrail'));
    });

    const categoryInput = await screen.findByLabelText('Category name');
    fireEvent.change(categoryInput, { target: { value: 'FOOD' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create rule/i }));
    });

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(c => (c[1] as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.templateId).toBe('CATEGORY_GUARDRAIL');
      expect(body.input.guardrailCategory).toBe('FOOD');
      expect(body.input.guardrailLimit).toBe(400);
      expect(body.input.guardrailWarnAt).toBe(80);
    });
  });

  it('omits templates listed in excludeTemplateIds', async () => {
    render(
      <RuleTemplateGallery excludeTemplateIds={['BUDGET_SPLIT_50_30_20', 'BUDGET_SPLIT_CUSTOM']} />
    );
    await waitFor(() => screen.getByText('Spending guardrail'));
    expect(screen.queryByText('50 / 30 / 20 budget split')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom budget split')).not.toBeInTheDocument();
    expect(screen.queryByText('Budget splits')).not.toBeInTheDocument();
  });

  it('does not open the builder for locked templates', async () => {
    render(<RuleTemplateGallery />);
    await waitFor(() => screen.getByText('Custom budget split'));
    await act(async () => {
      fireEvent.click(screen.getByText('Custom budget split'));
    });
    expect(screen.queryByText(/How this rule works/i)).not.toBeInTheDocument();
  });
});
