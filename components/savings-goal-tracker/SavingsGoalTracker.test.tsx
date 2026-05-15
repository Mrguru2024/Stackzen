import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SavingsGoalTracker from './index.tsx';

const _queryClient = new QueryClient();

describe('SavingsGoalTracker', () => {
  beforeEach(() => {
    _queryClient.clear();
  });

  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={_queryClient}>
        <SavingsGoalTracker />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    render(
      <QueryClientProvider client={_queryClient}>
        <SavingsGoalTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Error loading savings goals/i)).toBeInTheDocument();
    });
  });

  it('renders savings goals list on successful API call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: '1', name: 'Vacation', targetAmount: 1000, currentAmount: 500, userId: 'user-1' },
        ]),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <SavingsGoalTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Vacation - $500 / $1000')).toBeInTheDocument();
    });
  });

  it('submits new savings goal form successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '2',
          name: 'New Car',
          targetAmount: 20000,
          currentAmount: 0,
          userId: 'user-1',
        }),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <SavingsGoalTracker />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Car' } });
    fireEvent.change(screen.getByLabelText(/Target Amount/i), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText(/Current Amount/i), { target: { value: '0' } });
    fireEvent.click(screen.getByText(/Add Savings Goal/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Car',
          targetAmount: 20000,
          currentAmount: 0,
          userId: 'user-id',
        }),
      });
    });
  });
});
