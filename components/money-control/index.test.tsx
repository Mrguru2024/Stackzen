/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'u1', email: 'test@example.com', subscriptionLevel: 'FREE' },
    },
    status: 'authenticated',
  }),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () =>
      [],
  } as Response)
) as jest.Mock;

import MoneyControlCenter from '@/components/money-control';

describe('MoneyControlCenter', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('financial-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ events: [], nextCursor: null }) });
      }
      if (url.includes('smart-buckets')) {
        return Promise.resolve({ ok: true, json: async () => ({ buckets: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it('renders heading and ledger tab', async () => {
    render(<MoneyControlCenter />);
    expect(await screen.findByText(/Money control/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Review/i })).toBeInTheDocument();
  });
});
