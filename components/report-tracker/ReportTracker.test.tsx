import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportTracker from './index.tsx';

const _queryClient = new QueryClient();

describe('ReportTracker', () => {
  beforeEach(() => {
    _queryClient.clear();
  });

  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={_queryClient}>
        <ReportTracker />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    render(
      <QueryClientProvider client={_queryClient}>
        <ReportTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Error loading reports/i)).toBeInTheDocument();
    });
  });

  it('renders reports list on successful API call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: '1', name: 'Monthly Report', date: '2023-01-01', userId: 'user-1' },
        ]),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <ReportTracker />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Monthly Report - 1/1/2023')).toBeInTheDocument();
    });
  });

  it('submits new report form successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '2',
          name: 'Quarterly Report',
          date: '2023-01-02',
          userId: 'user-1',
        }),
    });
    render(
      <QueryClientProvider client={_queryClient}>
        <ReportTracker />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Quarterly Report' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2023-01-02' } });
    fireEvent.click(screen.getByText(/Add Report/i));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Quarterly Report',
          date: '2023-01-02',
          userId: 'user-id',
        }),
      });
    });
  });
});
