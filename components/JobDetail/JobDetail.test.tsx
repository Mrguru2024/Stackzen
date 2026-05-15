import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobDetail from './index';

const mockUseParams = jest.fn(() => ({ jobId: 'job_test_1' }));

jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

describe('JobDetail', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'job_test_1',
        title: 'Sample job',
        status: 'IN_PROGRESS',
        jobRevenue: 100,
        jobExpenses: 20,
        estimatedProfit: 80,
        remainingBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: { name: 'Acme' },
        quotes: [],
        invoices: [],
        expenses: [],
      }),
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('shows job title after load', async () => {
    render(<JobDetail />);
    expect(await screen.findByText('Sample job')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to jobs/i })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('heading', { name: /edit deposit policy/i })).toBeInTheDocument();
  });
});
