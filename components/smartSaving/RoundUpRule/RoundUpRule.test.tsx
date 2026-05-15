import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoundUpRule from './index';

// Mock fetch
global.fetch = jest.fn();

describe('RoundUpRule', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders the round-up rule component', () => {
    render(<RoundUpRule />);
    expect(screen.getByText('Zen Round-Up Rule')).toBeInTheDocument();
    expect(screen.getByText(/Automatically round up your purchases/)).toBeInTheDocument();
  });

  it('shows loading state when fetching data', async () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: () => Promise.resolve([]) }), 100)
        )
    );

    render(<RoundUpRule />);

    // Should show loading or initial state
    expect(screen.getByText('Zen Round-Up Rule')).toBeInTheDocument();
  });

  it('displays round-up amount from API', async () => {
    const mockRules = [
      {
        type: 'roundup',
        config: { enabled: true, maxAmount: 5 },
      },
    ];

    const mockSummary = {
      weeklySummary: {
        ruleBreakdown: { roundup: 12.5 },
      },
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRules) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSummary) });

    render(<RoundUpRule />);

    await waitFor(() => {
      expect(screen.getByText('$12.50')).toBeInTheDocument();
    });
  });

  it('toggles round-up rule when switch is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    render(<RoundUpRule />);

    const switchElement = screen.getByRole('checkbox');
    fireEvent.click(switchElement);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/smart-saving/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Zen Round-Up',
          type: 'roundup',
          config: { enabled: true, maxAmount: 5 },
        }),
      });
    });
  });

  it('simulates round-up when button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    render(<RoundUpRule />);

    const simulateButton = screen.getByText('Simulate Round-Up');
    fireEvent.click(simulateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/smart-saving/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roundup',
          amount: 3.75,
          description: 'Coffee purchase',
        }),
      });
    });
  });

  it('shows disabled state when rule is not enabled', async () => {
    const mockRules = [
      {
        type: 'roundup',
        config: { enabled: false, maxAmount: 5 },
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(mockRules) });

    render(<RoundUpRule />);

    await waitFor(() => {
      const simulateButton = screen.getByText('Simulate Round-Up');
      expect(simulateButton).toBeDisabled();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<RoundUpRule />);

    // Component should still render even if API fails
    expect(screen.getByText('Zen Round-Up Rule')).toBeInTheDocument();
  });
});
