import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Invoicing from './index.tsx';
import { useToast } from '@/app/hooks/use-toast';
import { type Invoice } from './types.ts';
import { loadStripe } from '@stripe/stripe-js';
import { SessionProvider } from 'next-auth/react';

// Mock the toast hook
jest.mock('@/app/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Invoicing', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockInvoices: Invoice[] = [
    {
      id: '1',
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      invoiceNumber: 'INV-001',
      amount: 1000,
      status: 'PENDING',
      dueDate: '2024-12-31',
      createdAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInvoices),
    });
  });

  it('renders invoice list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <Invoicing />
        </SessionProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });
  });

  it('creates new invoice', async () => {
    const { toast } = useToast();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInvoices),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <Invoicing />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Client Name'), {
      target: { value: 'New Client' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByLabelText('Due Date'), {
      target: { value: '2024-12-31' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Invoice'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    });
  });

  it('handles errors when creating invoice', async () => {
    const { toast } = useToast();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to create invoice'));

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <Invoicing />
        </SessionProvider>
      </QueryClientProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Client Name'), {
      target: { value: 'New Client' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByLabelText('Due Date'), {
      target: { value: '2024-12-31' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Invoice'));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    });
  });
});
