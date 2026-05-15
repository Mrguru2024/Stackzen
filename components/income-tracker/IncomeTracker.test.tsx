import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncomeTracker from './index.tsx';

const _queryClient = new QueryClient();

describe('IncomeTracker', () => {
  beforeEach(() => {
    _queryClient.clear();
  });

  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={_queryClient}>
        <IncomeTracker />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    render(
      <QueryClientProvider client={_queryClient}>
        <IncomeTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Error loading incomes/i)).toBeInTheDocument();
    });
  });

  it('renders income list on successful API call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: '1', amount: 100, description: 'Salary', date: '2023-01-01', userId: 'user-1' },
        ]),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <IncomeTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('$100 - Salary - 1/1/2023')).toBeInTheDocument();
    });
  });

  it('submits new income form successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '2',
          amount: 200,
          description: 'Bonus',
          date: '2023-01-02',
          userId: 'user-1',
        }),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <IncomeTracker />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Bonus' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2023-01-02' } });
    fireEvent.click(screen.getByText(/Add Income/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 200,
          description: 'Bonus',
          date: '2023-01-02',
          userId: 'user-id',
        }),
      });
    });
  });
});
