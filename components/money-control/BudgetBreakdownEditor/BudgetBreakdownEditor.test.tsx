/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import BudgetBreakdownEditor from './index';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function mockGetResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    subscriptionLevel: 'FREE',
    premium: false,
    active: false,
    ruleId: null,
    allocations: [],
    isPresetFreeTier: false,
    projection: {
      lookbackDays: 60,
      inflowCount: 4,
      totalInflow: 6400,
      avgPerDeposit: 1600,
      avgMonthly: 3200,
    },
    freePresets: {
      FIFTY_THIRTY_TWENTY: [
        { bucket: 'needs', percent: 50 },
        { bucket: 'wants', percent: 30 },
        { bucket: 'savings', percent: 20 },
      ],
      FORTY_THIRTY_THIRTY: [
        { bucket: 'needs', percent: 40 },
        { bucket: 'wants', percent: 30 },
        { bucket: 'savings', percent: 30 },
      ],
    },
    ...overrides,
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => mockGetResponse(),
    } as Response)
  );
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('BudgetBreakdownEditor — free tier (locked, basic feature only)', () => {
  it('renders the fixed 50 / 30 / 20 split read-only with projections', async () => {
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText('Needs'));
    expect(screen.getByText('Wants')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Free plan')).toBeInTheDocument();
  });

  it('does not render any preset switcher, slider, or percent input', async () => {
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText('Needs'));
    expect(screen.queryByRole('button', { name: /Use 50 \/ 30 \/ 20/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Use 40 \/ 30 \/ 30/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Percent for/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Slider for/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Add an envelope/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Activate auto-split|Save changes/ })).not.toBeInTheDocument();
  });

  it('toggles auto-split and posts only the canonical preset', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGetResponse(),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ active: true, ruleId: 'rule-1' }),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGetResponse({ active: true, ruleId: 'rule-1' }),
    } as Response);

    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText('Needs'));
    const toggle = screen.getByLabelText('Toggle auto-split');
    await act(async () => {
      fireEvent.click(toggle);
    });
    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(c => (c[1] as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body).toEqual({ active: true, preset: 'FIFTY_THIRTY_TWENTY' });
    });
  });

  it('mentions Pro for users who want customization', async () => {
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText('Needs'));
    expect(screen.getByText(/Pro unlocks custom budget settings/i)).toBeInTheDocument();
  });
});

describe('BudgetBreakdownEditor — Pro tier (full editor)', () => {
  it('renders sliders, percent inputs, presets, and add envelope controls', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockGetResponse({
          subscriptionLevel: 'PRO',
          premium: true,
          allocations: [
            { bucket: 'needs', percent: 45 },
            { bucket: 'wants', percent: 30 },
            { bucket: 'savings', percent: 25 },
          ],
        }),
    } as Response);
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText(/You are not limited to two presets/i));
    expect(screen.getByText(/You are not limited to two presets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use 50 \/ 30 \/ 20/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use 40 \/ 30 \/ 30/i })).toBeInTheDocument();
    expect(screen.getByText(/Popular templates \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Percent for needs')).toBeInTheDocument();
    expect(screen.getByLabelText(/Add an envelope/i)).toBeInTheDocument();
  });

  it('enables save when percentages total 100', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockGetResponse({
          subscriptionLevel: 'PRO',
          premium: true,
          allocations: [
            { bucket: 'needs', percent: 45 },
            { bucket: 'wants', percent: 30 },
            { bucket: 'savings', percent: 25 },
          ],
        }),
    } as Response);
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText(/You are not limited to two presets/i));
    const needsInput = screen.getByLabelText('Percent for needs') as HTMLInputElement;
    const savingsInput = screen.getByLabelText('Percent for savings') as HTMLInputElement;
    fireEvent.change(needsInput, { target: { value: '50' } });
    fireEvent.change(savingsInput, { target: { value: '20' } });
    expect(screen.getByRole('button', { name: /Activate auto-split|Save changes/ })).toBeEnabled();
  });

  it('disables save when percentages do not total 100', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockGetResponse({
          subscriptionLevel: 'PRO',
          premium: true,
          allocations: [
            { bucket: 'needs', percent: 40 },
            { bucket: 'wants', percent: 30 },
            { bucket: 'savings', percent: 20 },
          ],
        }),
    } as Response);
    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText(/You are not limited to two presets/i));
    const input = screen.getByLabelText('Percent for needs') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30' } });
    expect(screen.getByRole('button', { name: /Activate auto-split|Save changes/ })).toBeDisabled();
    expect(screen.getByText(/Must total 100%/i)).toBeInTheDocument();
  });

  it('posts customAllocations when switching off', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockGetResponse({
          subscriptionLevel: 'PRO',
          premium: true,
          active: true,
          ruleId: 'rule-1',
          allocations: [
            { bucket: 'needs', percent: 50 },
            { bucket: 'wants', percent: 30 },
            { bucket: 'savings', percent: 20 },
          ],
        }),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ active: false, ruleId: 'rule-1' }),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockGetResponse({
          subscriptionLevel: 'PRO',
          premium: true,
          active: false,
          ruleId: 'rule-1',
        }),
    } as Response);

    render(<BudgetBreakdownEditor />);
    await waitFor(() => screen.getByText(/You are not limited to two presets/i));
    const toggle = screen.getByLabelText('Toggle auto-split');
    await act(async () => {
      fireEvent.click(toggle);
    });
    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(c => (c[1] as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.active).toBe(false);
    });
  });
});
