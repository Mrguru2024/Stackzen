import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Invoicing from './index.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof Invoicing> = {
  title: 'Dashboard/Invoicing',
  component: Invoicing,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        // Loading state
        rest.get('/api/invoices', (req, res, ctx) => {
          if (req.url.searchParams.get('delay') === 'true') {
            return res(ctx.delay(2000), ctx.json(mockData));
          }
          return res(ctx.json(mockData));
        }),
        // Create invoice
        rest.post('/api/invoices', async (req, res, ctx) => {
          const body = await req.json();
          return res(
            ctx.json({
              id: 'new-invoice',
              ...body,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          );
        }),
        // Delete invoice
        rest.delete('/api/invoices/:id', (req, res, ctx) => {
          return res(ctx.json({ message: 'Invoice deleted successfully' }));
        }),
        // Send invoice
        rest.post('/api/invoices/:id/send', (req, res, ctx) => {
          return res(ctx.json({ message: 'Invoice sent successfully' }));
        }),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Invoicing>;

const mockData = {
  invoices: [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      clientName: 'Acme Corporation',
      clientEmail: 'billing@acme.com',
      dueDate: '2024-04-01',
      total: 2500,
      status: 'draft',
      paymentMethod: 'online',
      lineItems: [
        {
          id: '1',
          description: 'Web Development Services',
          quantity: 1,
          unitPrice: 2500,
          amount: 2500,
        },
      ],
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      clientName: 'TechStart Inc',
      clientEmail: 'finance@techstart.com',
      dueDate: '2024-03-30',
      total: 3500,
      status: 'sent',
      paymentMethod: 'bank',
      lineItems: [
        {
          id: '2',
          description: 'UI/UX Design',
          quantity: 1,
          unitPrice: 2000,
          amount: 2000,
        },
        {
          id: '3',
          description: 'Frontend Development',
          quantity: 1,
          unitPrice: 1500,
          amount: 1500,
        },
      ],
      createdAt: '2024-03-15',
      updatedAt: '2024-03-15',
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      clientName: 'Global Solutions Ltd',
      clientEmail: 'accounts@globalsolutions.com',
      dueDate: '2024-03-10',
      total: 5000,
      status: 'overdue',
      paymentMethod: 'check',
      lineItems: [
        {
          id: '4',
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 500,
          amount: 5000,
        },
      ],
      createdAt: '2024-02-25',
      updatedAt: '2024-02-25',
    },
  ],
  pagination: {
    total: 3,
    pages: 1,
    page: 1,
    limit: 10,
  },
  summary: {
    totalInvoices: 3,
    totalPaid: 0,
    totalOverdue: 1,
    totalDraft: 1,
    totalAmount: 11000,
    paidAmount: 0,
    overdueAmount: 5000,
    draftAmount: 2500,
  },
};

export const Default: Story = {};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get('/api/invoices', (req, res, ctx) => {
          return res(ctx.delay('infinite'));
        }),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get('/api/invoices', (req, res, ctx) => {
          return res(
            ctx.json({
              invoices: [],
              pagination: {
                total: 0,
                pages: 1,
                page: 1,
                limit: 10,
              },
              summary: {
                totalInvoices: 0,
                totalPaid: 0,
                totalOverdue: 0,
                totalDraft: 0,
                totalAmount: 0,
                paidAmount: 0,
                overdueAmount: 0,
                draftAmount: 0,
              },
            })
          );
        }),
      ],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get('/api/invoices', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        }),
      ],
    },
  },
};

export const WithFilters: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get('/api/invoices', (req, res, ctx) => {
          const status = req.url.searchParams.get('status');
          const search = req.url.searchParams.get('search');

          let filteredInvoices = mockData.invoices;

          if (status) {
            filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
          }

          if (search) {
            const searchLower = search.toLowerCase();
            filteredInvoices = filteredInvoices.filter(
              invoice =>
                invoice.clientName.toLowerCase().includes(searchLower) ||
                invoice.clientEmail.toLowerCase().includes(searchLower) ||
                invoice.invoiceNumber.toLowerCase().includes(searchLower)
            );
          }

          return res(
            ctx.json({
              invoices: filteredInvoices,
              pagination: {
                total: filteredInvoices.length,
                pages: 1,
                page: 1,
                limit: 10,
              },
              summary: mockData.summary,
            })
          );
        }),
      ],
    },
  },
};
