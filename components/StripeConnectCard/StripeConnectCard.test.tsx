import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StripeConnectCard, type StripeConnectStatus } from './index';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const NOT_CONNECTED: StripeConnectStatus = {
  connected: false,
  accountId: null,
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  status: 'not_connected',
  pendingRequirements: [],
};

const ACTIVE: StripeConnectStatus = {
  connected: true,
  accountId: 'acct_123',
  chargesEnabled: true,
  payoutsEnabled: true,
  detailsSubmitted: true,
  status: 'active',
  pendingRequirements: [],
};

const ONBOARDING: StripeConnectStatus = {
  connected: true,
  accountId: 'acct_123',
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  status: 'onboarding',
  pendingRequirements: ['external_account', 'individual.id_number'],
};

function makeFetcher(map: Record<string, unknown>): typeof fetch {
  return jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const payload = map[url];
    return new Response(JSON.stringify(payload ?? {}), { status: 200 }) as Response;
  }) as unknown as typeof fetch;
}

describe('StripeConnectCard', () => {
  it('shows the connect button when the user has not connected Stripe', () => {
    render(<StripeConnectCard initialStatus={NOT_CONNECTED} />);
    expect(screen.getByText(/Online payments via Stripe/i)).toBeInTheDocument();
    expect(screen.getByTestId('stripe-connect-card-connect')).toBeInTheDocument();
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
  });

  it('shows ready badge and management buttons when active', () => {
    render(<StripeConnectCard initialStatus={ACTIVE} />);
    expect(screen.getByText(/Ready to accept payments/i)).toBeInTheDocument();
    expect(screen.getByTestId('stripe-connect-card-refresh')).toBeInTheDocument();
    expect(screen.getByTestId('stripe-connect-card-disconnect')).toBeInTheDocument();
  });

  it('lists pending Stripe requirements in plain English', () => {
    render(<StripeConnectCard initialStatus={ONBOARDING} />);
    expect(screen.getByText(/Bank account for payouts/i)).toBeInTheDocument();
    expect(screen.getByText(/Government-issued ID number/i)).toBeInTheDocument();
  });

  it('starts Stripe onboarding when the user clicks Connect', async () => {
    const fetcher = jest.fn(async () =>
      new Response(JSON.stringify({ url: 'https://connect.stripe.com/setup/s/test' }), {
        status: 200,
      })
    ) as unknown as typeof fetch;

    render(<StripeConnectCard initialStatus={NOT_CONNECTED} fetcher={fetcher} />);
    fireEvent.click(screen.getByTestId('stripe-connect-card-connect'));

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith('/api/stripe/connect/onboard', {
        method: 'POST',
        credentials: 'include',
      });
    });
  });
});
